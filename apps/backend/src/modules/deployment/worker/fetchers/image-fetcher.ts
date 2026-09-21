import { Injectable } from '@nestjs/common';
import { FetchContext, SourceFetcher } from './source-fetcher';

@Injectable()
export class ImageFetcher implements SourceFetcher {
  fetch(ctx: FetchContext): Promise<string> {
    // Nothing to fetch for IMAGE: the build step pulls service.imageRef.
    // Revisit: skip the build entirely when source is IMAGE.
    return Promise.resolve(ctx.workspace);
  }
}
