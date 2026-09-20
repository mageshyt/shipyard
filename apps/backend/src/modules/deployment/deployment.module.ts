import { Module } from '@nestjs/common';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';
import { QueueModule } from '@app/core/queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [DeploymentController],
  providers: [DeploymentService],
})
export class DeploymentModule {}
