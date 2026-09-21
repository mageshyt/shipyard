import { Injectable, Logger } from '@nestjs/common';
import { DockerService } from '../docker.service';
import { PullImageDto } from './dto/pull-image.dto';
import { readdir } from 'node:fs/promises';
import {
  DockerImageDto,
  RemoveImageResponseDto,
} from './dto/image-response.dto';
import { toDto } from '@app/shared/util';
import type { PullImageResponse } from '@workspace/types';
import { UnrecoverableError } from 'bullmq';
import { isAbsolute, normalize } from 'node:path';

export interface BuildImageOptions {
  buildArgs?: Record<string, string>;
  onProgress?: (line: string) => void;
  signal?: AbortSignal;
}

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  constructor(private readonly dockerService: DockerService) { }

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

  async remove(
    id: string,
    force: boolean = false,
  ): Promise<RemoveImageResponseDto> {
    try {
      const image = this.dockerService.client.getImage(id);
      await image.remove({ force });

      return { id, removed: true };
    } catch (error) {
      this.logger.error('Error removing image:', error);
      throw error;
    }
  }

  async buildImage(
    sourceDir: string,
    dockerfilePath: string,
    imageTag: string,
    opts?: BuildImageOptions,
  ): Promise<string> {
    const dockerfile = normalize(dockerfilePath);
    if (isAbsolute(dockerfile) || dockerfile.startsWith('..')) {
      throw new UnrecoverableError(
        `Dockerfile path escapes the build context: ${dockerfilePath}`,
      );
    }

    this.logger.log(
      `Building image ${imageTag} from ${dockerfile} in ${sourceDir}`,
    );

    try {
      const entries = await readdir(sourceDir);
      const stream = await this.dockerService.client.buildImage(
        {
          context: sourceDir,
          src: entries,
        },
        {
          t: imageTag,
          dockerfile,
          buildargs: opts?.buildArgs,
          abortSignal: opts?.signal,
        },
      );

      await new Promise<void>((resolve, reject) => {
        this.dockerService.client.modem.followProgress(
          stream,
          (err: Error | null) => (err ? reject(err) : resolve()),
          (event: unknown) => opts?.onProgress?.(JSON.stringify(event)),
        );
      });

      return imageTag;
    } catch (error) {
      console.log(error);
      this.logger.error(`Error building image ${imageTag}:`, error);
      throw error;
    }
  }
}
