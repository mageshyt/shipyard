import { Module } from '@nestjs/common';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';
import { QueueModule } from '@app/core/queue/queue.module';
import { ImagesModule } from '@app/modules/docker/images/images.module';
import { DeploymentProcessor } from './worker/deployment.processor';
import { GitFetcher } from './worker/fetchers/git-fetcher';
import { ImageFetcher } from './worker/fetchers/image-fetcher';
import { UploadFetcher } from './worker/fetchers/upload-fetcher';
import { DockerBuilder } from './worker/builders/docker-builder';
import { ContainerModule } from '../docker/container/container.module';

@Module({
  imports: [QueueModule, ImagesModule, ContainerModule],
  controllers: [DeploymentController],
  providers: [
    DeploymentService,
    DeploymentProcessor,
    GitFetcher,
    ImageFetcher,
    UploadFetcher,
    DockerBuilder,
  ],
})
export class DeploymentModule {}
