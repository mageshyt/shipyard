import { Injectable, Logger } from '@nestjs/common';
import { DockerService } from '../docker.service';
import { PullImageDto } from './dto/pull-image.dto';
import { DockerImageDto } from './dto/image-response.dto';
import { toDto } from '@app/shared/util';
import type { PullImageResponse } from '@workspace/types';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  constructor(private readonly dockerService: DockerService) {}

  async findAll(): Promise<DockerImageDto[]> {
    try {
      const images = await this.dockerService.client.listImages();
      return toDto(DockerImageDto, images);
    } catch (error) {
      this.logger.error('Error listing images:', error);
      throw error;
    }
  }

  async pullImage(dto: PullImageDto): Promise<PullImageResponse> {
    const ref = `${dto.fromImage}:${dto.tag}`;

    try {
      const stream = await this.dockerService.client.pull(ref);

      await new Promise<void>((resolve, reject) => {
        this.dockerService.client.modem.followProgress(
          stream,
          (err: Error | null) => (err ? reject(err) : resolve()),
        );
      });

      return {
        fromImage: dto.fromImage,
        tag: dto.tag,
        message: `Successfully pulled image ${ref}`,
      };
    } catch (error) {
      this.logger.error(`Error pulling image ${ref}:`, error);
      throw error;
    }
  }

  remove(id: string) {
    try {
      const image = this.dockerService.client.getImage(id);
      return image.remove();
    } catch (error) {
      this.logger.error('Error removing image:', error);
      throw error;
    }
  }
}
