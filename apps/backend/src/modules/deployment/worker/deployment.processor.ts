import {
  DEPLOYMENTS_QUEUE,
  getDeploymentWorkerConfig,
} from '@app/core/queue/queue.constants';
import { PrismaService } from '@app/shared/services/prisma/prisma.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { DeploymentJobData } from '@workspace/types';
import { Job, UnrecoverableError } from 'bullmq';
import { mkdir, rm } from 'node:fs/promises';
import { ServiceSource } from 'src/generated/prisma/client';
import { GitFetcher } from './fetchers/git-fetcher';
import { SourceFetcher } from './fetchers/source-fetcher';
import { ImageFetcher } from './fetchers/image-fetcher';
import { UploadFetcher } from './fetchers/upload-fetcher';

@Processor(DEPLOYMENTS_QUEUE, getDeploymentWorkerConfig())
export class DeploymentProcessor extends WorkerHost {
  private readonly logger = new Logger(DeploymentProcessor.name);
  private readonly fetchers: Record<ServiceSource, SourceFetcher>;

  constructor(
    private readonly db: PrismaService,
    private readonly gitFetcher: GitFetcher,
    private readonly imageFetcher: ImageFetcher,
    private readonly uploadFetcher: UploadFetcher,
  ) {
    super();
    this.fetchers = {
      [ServiceSource.GIT]: this.gitFetcher,
      [ServiceSource.IMAGE]: this.imageFetcher,
      [ServiceSource.UPLOAD]: this.uploadFetcher,
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

      const fetcher = this.fetchers[service.source];

      if (!fetcher) {
        throw new UnrecoverableError(
          `No fetcher available for service source ${service.source}`,
        );
      }
      const workspace = `/tmp/deployment-${deploymentId}`;
      await rm(workspace, { recursive: true, force: true }); // clean up any previous workspace
      await mkdir(workspace, { recursive: true }); // create a new workspace

      // fetch the source code into the workspace
      await fetcher.fetch({
        deployment,
        service,
        workspace,
      });

      // build config

      // TODO: Implement the build and deploy steps here, using the fetched source code in the workspace.
      await this.db.$transaction([
        this.db.deployment.update({
          where: { id: deploymentId },
          data: { status: 'RUNNING', finishedAt: new Date() },
        }),
        this.db.log.create({
          data: {
            message: 'Fetch complete (test scaffold)',
            level: 'INFO',
            serviceId: deployment.serviceId,
            deploymentId,
          },
        }),
      ]);
    } catch (error) {
      await this.failDeployment(deploymentId, error);
      throw error;
    }
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
