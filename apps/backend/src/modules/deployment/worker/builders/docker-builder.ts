import { ImagesService } from '@app/modules/docker/images/images.service';
import { Injectable, Logger } from '@nestjs/common';
import { UnrecoverableError } from 'bullmq';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { BuildContext, BuildStrategy } from './build-strategy';

@Injectable()
export class DockerBuilder implements BuildStrategy {
  private readonly logger = new Logger(DockerBuilder.name);

  constructor(private readonly imageService: ImagesService) {}

  async build({
    service,
    sourceDir,
    imageTag,
    buildArgs,
  }: BuildContext): Promise<string> {
    const contextDir = join(sourceDir, service.dockerContextPath ?? '.');
    const dockerfile = service.dockerfilePath ?? 'Dockerfile';

    if (!existsSync(join(contextDir, dockerfile))) {
      throw new UnrecoverableError(
        `Dockerfile not found at ${dockerfile} in ${contextDir}`,
      );
    }

    this.logger.log(`Building ${imageTag} from ${dockerfile}`);
    return this.imageService.buildImage(contextDir, dockerfile, imageTag, {
      buildArgs,
    });
  }
}
