import { Module } from '@nestjs/common';
import { VolumeService } from './volume.service';
import { VolumeController } from './volume.controller';
import { DockerModule } from '../docker.module';

@Module({
  imports: [DockerModule],
  controllers: [VolumeController],
  providers: [VolumeService],
})
export class VolumeModule {}
