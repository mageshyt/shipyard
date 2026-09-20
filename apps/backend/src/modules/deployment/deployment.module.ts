import { Module } from '@nestjs/common';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';
import { QueueModule } from '@app/core/queue/queue.module';
import { DeploymentProcessor } from './worker/deployment.processor';
import { GitFetcher } from './worker/fetchers/git-fetcher';
import { ImageFetcher } from './worker/fetchers/image-fetcher';
import { UploadFetcher } from './worker/fetchers/upload-fetcher';

@Module({
  imports: [QueueModule],
  controllers: [DeploymentController],
  providers: [
    DeploymentService,
    DeploymentProcessor,
    GitFetcher,
    ImageFetcher,
    UploadFetcher,
  ],
})
export class DeploymentModule {}
