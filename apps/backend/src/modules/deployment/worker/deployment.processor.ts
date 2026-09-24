import {
  DEPLOYMENTS_QUEUE,
  getDeploymentWorkerConfig,
} from '@app/core/queue/queue.constants';
import { PrismaService } from '@app/shared/services/prisma/prisma.service';
import { SHIPYARD_NETWORK } from '@app/shared/util';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { DeploymentJobData, ServicePortMapping } from '@workspace/types';
import { Job, UnrecoverableError } from 'bullmq';
import { mkdir, rm } from 'node:fs/promises';
import {
  BuildType,
  ServiceSource,
  ServiceType,
} from 'src/generated/prisma/client';
import { GitFetcher } from './fetchers/git-fetcher';
import { SourceFetcher } from './fetchers/source-fetcher';
import { ImageFetcher } from './fetchers/image-fetcher';
import { UploadFetcher } from './fetchers/upload-fetcher';
import { transitionDeployment } from '../deployment-status';
import { DockerBuilder } from './builders/docker-builder';
import { BuildStrategy } from './builders/build-strategy';
import { ContainerService } from '@app/modules/docker/container/container.service';

const DATABASE_DATA_PATHS: Record<string, string> = {
  postgres: '/var/lib/postgresql/data',
  'pgvector/pgvector:pg': '/var/lib/postgresql/data',
  mysql: '/var/lib/mysql',
  mariadb: '/var/lib/mysql',
  mongo: '/data/db',
  redis: '/data',
};

@Processor(DEPLOYMENTS_QUEUE, getDeploymentWorkerConfig())
export class DeploymentProcessor extends WorkerHost {
  private readonly logger = new Logger(DeploymentProcessor.name);
  private readonly fetchers: Record<ServiceSource, SourceFetcher>;
  private readonly builders: Record<BuildType, BuildStrategy>;

  constructor(
    private readonly db: PrismaService,
    private readonly gitFetcher: GitFetcher,
    private readonly imageFetcher: ImageFetcher,
    private readonly uploadFetcher: UploadFetcher,
    private readonly dockerBuilder: DockerBuilder,
    private readonly containerService: ContainerService,
  ) {
    super();
    this.fetchers = {
      [ServiceSource.GIT]: this.gitFetcher,
      [ServiceSource.IMAGE]: this.imageFetcher,
      [ServiceSource.UPLOAD]: this.uploadFetcher,
    };

    this.builders = {
      [BuildType.DOCKER]: this.dockerBuilder,
      [BuildType.NATIVE]: this.dockerBuilder, // For now, we can use the DockerBuilder for native builds as well. This can be replaced with a NativeBuilder in the future.
    };
  }

  async process(job: Job<DeploymentJobData>): Promise<any> {
    const { deploymentId } = job.data;

    try {
      if (!deploymentId) {
        throw new UnrecoverableError('Deployment ID is required');
      }

      const deployment = await this.db.deployment.findUnique({
        where: { id: deploymentId },
      });

      if (!deployment) {
        throw new UnrecoverableError(
          `Deployment with ID ${deploymentId} not found`,
        );
      }

      if (deployment.status !== 'QUEUED') {
        this.logger.warn(
          `Deployment ${deploymentId} already ${deployment.status} — skipping`,
        );
        return;
      }

      // collect information about the service config and environment variables
      const [service, environments] = await Promise.all([
        this.db.service.findUnique({
          where: { id: deployment.serviceId },
        }),
        this.db.environmentVariable.findMany({
          where: { serviceId: deployment.serviceId },
        }),
      ]);

      if (!service) {
        throw new UnrecoverableError(
          `Service with ID ${deployment.serviceId} not found`,
        );
      }

      const buildArgs: Record<string, string> = {};
      for (const variable of environments) {
        if (variable.scope === 'BUILD' || variable.scope === 'BOTH') {
          buildArgs[variable.key] = variable.value;
        }
      }

      const secretsBaked = environments
        .filter((v) => v.isSecret && v.scope !== 'RUNTIME')
        .map((v) => v.key);
      if (secretsBaked.length > 0) {
        this.logger.warn(
          `Secrets baked into image layers as build args: ${secretsBaked.join(', ')}`,
        );
      }

      const fetcher = this.fetchers[service.source];

      if (!fetcher) {
        throw new UnrecoverableError(
          `No fetcher available for service source ${service.source}`,
        );
      }
      const workspace = `/tmp/deployment-${deploymentId}`;
      await rm(workspace, { recursive: true, force: true }); // clean up any previous workspace
      await mkdir(workspace, { recursive: true }); // create a new workspace

      await transitionDeployment(this.db, deploymentId, 'PREPARING', {
        startedAt: new Date(),
      });

      // fetch the source code into the workspace
      await fetcher.fetch({
        deployment,
        service,
        workspace,
      });

      await transitionDeployment(this.db, deploymentId, 'BUILDING');

      let imageTag: string;
      if (service.source === 'IMAGE') {
        if (!service.imageRef) {
          throw new UnrecoverableError(
            `Service ${service.id} has no imageRef for IMAGE source`,
          );
        }
        imageTag = service.imageRef;
      } else {
        // build config
        const buildStrategy = this.builders[service.buildType];

        if (!buildStrategy) {
          throw new UnrecoverableError(
            `No builder available for build type ${service.buildType}`,
          );
        }

        imageTag = await buildStrategy.build({
          deployment,
          service,
          sourceDir: workspace,
          imageTag: `shipyard/${service.slug ?? service.id}:${deploymentId}`,
          buildArgs,
        });
      }

      this.logger.log(`Deployment ${deploymentId} built image: ${imageTag}`);

      await transitionDeployment(this.db, deploymentId, 'DEPLOYING');
      this.logger.log(
        `Deployment ${deploymentId} deploying image: ${imageTag}`,
      );

      // stop old → start new
      await this.containerService.removeServiceContainers(service.id);

      // declared host:container mappings (validated at service write time)
      const portMappings =
        (service.ports as unknown as ServicePortMapping[] | null) ?? undefined;

      const volumes = this.databaseVolume(service);

      const container = await this.containerService.createContainer({
        image: imageTag,
        serviceId: service.id,
        deploymentId,
        network: SHIPYARD_NETWORK,
        ports: portMappings,
        volumes,
        ...(service.startCommand
          ? { cmd: service.startCommand.split(/\s+/) }
          : {}),
      });
      this.logger.log(
        `Deployment ${deploymentId} created container: ${container.Id}`,
      );

      await this.containerService.startContainer(container.Id);

      const live = await this.containerService.findContainerById(container.Id);
      if (live?.State?.Status !== 'running') {
        throw new Error(
          `Container ${container.Id} is ${live?.State?.Status ?? 'gone'} after start`,
        );
      }

      await transitionDeployment(this.db, deploymentId, 'RUNNING', {
        finishedAt: new Date(),
      });
      this.logger.log(`Deployment ${deploymentId} running`);
    } catch (error) {
      await this.failDeployment(deploymentId, error);
      throw error;
    }
  }

  private databaseVolume(service: {
    id: string;
    type: ServiceType;
    imageRef: string | null;
  }): { name: string; target: string }[] | undefined {
    if (service.type !== ServiceType.DATABASE) return undefined;

    const image = service.imageRef ?? '';
    const entry = Object.entries(DATABASE_DATA_PATHS).find(([prefix]) =>
      image.startsWith(prefix),
    );
    if (!entry) {
      this.logger.warn(
        `No known data path for image ${image}: container will not persist data`,
      );
      return undefined;
    }

    return [
      {
        name: `shipyard-data-${service.id.slice(-6).toLowerCase()}`,
        target: entry[1],
      },
    ];
  }

  private async failDeployment(
    deploymentId: string | undefined,
    error: unknown,
  ): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);

    if (!deploymentId) {
      this.logger.error(
        `Deployment job failed with no deployment id: ${message}`,
      );
      return;
    }

    const deployment = await this.db.deployment.findUnique({
      where: { id: deploymentId },
    });
    if (!deployment) {
      this.logger.warn(`Deployment ${deploymentId} not found while failing`);
      return;
    }
    if (['RUNNING', 'FAILED', 'CANCELLED'].includes(deployment.status)) {
      return;
    }

    await this.db.$transaction([
      this.db.deployment.update({
        where: { id: deploymentId },
        data: { status: 'FAILED', finishedAt: new Date(), error: message },
      }),
      this.db.log.create({
        data: {
          message: `Deployment failed: ${message}`,
          level: 'ERROR',
          serviceId: deployment.serviceId,
          deploymentId,
        },
      }),
    ]);
  }
}
