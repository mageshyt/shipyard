import {
  DEPLOYMENTS_QUEUE,
  DEPLOY_JOB_NAME,
} from '@app/core/queue/queue.constants';
import { PrismaService } from '@app/shared/services/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { Prisma } from 'src/generated/prisma/client';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import {
  ACTIVE_DEPLOYMENT_STATUSES,
  transitionDeployment,
} from './deployment-status';

@Injectable()
export class DeploymentService {
  private readonly logger = new Logger(DeploymentService.name);
  constructor(
    @InjectQueue(DEPLOYMENTS_QUEUE) private readonly deploymentQueue: Queue,
    private readonly db: PrismaService,
  ) { }

  async createDeploymentJob(
    serviceId: string,
    ownerId: string,
    dto: CreateDeploymentDto,
  ) {
    const service = await this.db.service.findFirst({
      where: { id: serviceId, project: { ownerId } },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const existingDeployment = await this.db.deployment.findFirst({
      where: {
        serviceId,
        status: { in: ACTIVE_DEPLOYMENT_STATUSES },
      },
    });
    if (existingDeployment) {
      this.logger.warn(
        `Deployment already active for service ${serviceId} (deployment ${existingDeployment.id})`,
      );
      throw new ConflictException(
        'A deployment is already in progress for this service',
      );
    }

    this.logger.log(`Creating deployment for service ${serviceId}`);

    try {
      const deployment = await this.db.deployment.create({
        data: {
          serviceId,
          source: dto.source ?? 'MANUAL',
          branch: dto.branch,
          commitHash: dto.commitHash,
          status: 'QUEUED',
        },
      });

      await this.deploymentQueue.add(
        DEPLOY_JOB_NAME,
        { deploymentId: deployment.id },
        { jobId: deployment.id },
      );

      const [queued] = await this.db.$transaction([
        this.db.deployment.update({
          where: { id: deployment.id },
          data: { jobId: deployment.id },
        }),
        this.db.log.create({
          data: {
            message: 'Deployment queued',
            level: 'INFO',
            serviceId,
            deploymentId: deployment.id,
          },
        }),
      ]);

      this.logger.log(
        `Deployment ${deployment.id} queued for service ${serviceId}`,
      );

      return {
        id: queued.id,
        serviceId: queued.serviceId,
        source: queued.source,
        status: queued.status,
        jobId: queued.jobId,
        createdAt: queued.createdAt,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A deployment is already in progress for this service',
        );
      }
      throw error;
    }
  }

  async cancelDeploymentJob(
    serviceId: string,
    deploymentId: string,
    ownerId: string,
  ) {
    const deployment = await this.db.deployment.findUnique({
      where: { id: deploymentId, serviceId, service: { project: { ownerId } } },
    });
    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }
    if (!ACTIVE_DEPLOYMENT_STATUSES.includes(deployment.status)) {
      throw new ConflictException(
        `Deployment is ${deployment.status}; only queued or in-progress deployments can be cancelled`,
      );
    }

    try {
      const job = deployment.jobId
        ? await this.deploymentQueue.getJob(deployment.jobId)
        : null;

      this.logger.log(
        `Cancelling deployment ${deploymentId} for service ${serviceId}`,
      );

      if (job && (await job.getState()) !== 'active') {
        await job.remove();
        this.logger.log(`Removed job ${job.id} from queue`);
      }

      return transitionDeployment(this.db, deployment.id, 'CANCELLED', {
        finishedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Error cancelling deployment ${deploymentId} for service ${serviceId}`,
        error instanceof Error ? error : undefined,
      );

      throw error;
    }
  }

  async restartDeploymentJob(
    serviceId: string,
    deploymentId: string,
    ownerId: string,
  ) {
    const deployment = await this.db.deployment.findUnique({
      where: { id: deploymentId, serviceId, service: { project: { ownerId } } },
    });
    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }
    if (deployment.status !== 'FAILED') {
      throw new ConflictException(
        `Deployment is ${deployment.status}; only failed deployments can be restarted`,
      );
    }

    this.logger.log(
      `Restarting deployment ${deploymentId} for service ${serviceId}`,
    );

    return this.createDeploymentJob(serviceId, ownerId, {
      source: deployment.source,
      branch: deployment.branch ?? undefined,
      commitHash: deployment.commitHash ?? undefined,
    });
  }
}
