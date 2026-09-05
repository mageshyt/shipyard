import { Module } from '@nestjs/common';
import { NetworksService } from './networks.service';
import { NetworksController } from './networks.controller';
import { DockerModule } from '../docker.module';

@Module({
  imports: [DockerModule],
  controllers: [NetworksController],
  providers: [NetworksService],
})
export class NetworksModule { }
