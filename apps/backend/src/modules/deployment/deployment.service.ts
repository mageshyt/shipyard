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

@Injectable()
export class DeploymentService {
  private readonly logger = new Logger(DeploymentService.name);
  constructor(
    @InjectQueue(DEPLOYMENTS_QUEUE) private readonly deploymentQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async createDeploymentJob(
    serviceId: string,
    ownerId: string,
    dto: CreateDeploymentDto,
  ) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, project: { ownerId } },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const existingDeployment = await this.prisma.deployment.findFirst({
      where: {
        serviceId,
        status: {
          in: ['QUEUED', 'PREPARING', 'BUILDING', 'DEPLOYING'],
        },
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
      const deployment = await this.prisma.deployment.create({
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

      const [queued] = await this.prisma.$transaction([
        this.prisma.deployment.update({
          where: { id: deployment.id },
          data: { jobId: deployment.id },
        }),
        this.prisma.log.create({
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
}
