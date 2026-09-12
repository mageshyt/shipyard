import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { DockerModule } from '../docker.module';

@Module({
  imports: [DockerModule],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}
