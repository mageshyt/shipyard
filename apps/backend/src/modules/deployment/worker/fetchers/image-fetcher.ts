import { ImagesService } from '@app/modules/docker/images/images.service';
import { Injectable, Logger } from '@nestjs/common';
import { UnrecoverableError } from 'bullmq';
import { FetchContext, SourceFetcher } from './source-fetcher';

@Injectable()
export class ImageFetcher implements SourceFetcher {
  private readonly logger = new Logger(ImageFetcher.name);

  constructor(private readonly imagesService: ImagesService) { }

  async fetch(ctx: FetchContext): Promise<string> {
    const { service, workspace } = ctx;

    if (!service.imageRef) {
      throw new UnrecoverableError(
        `Service ${service.id} has no imageRef for IMAGE source`,
      );
    }

    // split registry-port-safe: tag is whatever follows the LAST colon
    const ref = service.imageRef;
    const cut = ref.lastIndexOf(':');
    const fromImage = cut > 0 ? ref.slice(0, cut) : ref;
    const tag = cut > 0 ? ref.slice(cut + 1) : 'latest';

    this.logger.log(`Pulling image ${fromImage}:${tag}`);
    await this.imagesService.pullImage({ fromImage, tag });
    return workspace;
  }
}
