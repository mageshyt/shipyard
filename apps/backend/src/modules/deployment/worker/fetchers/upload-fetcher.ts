import { Injectable } from '@nestjs/common';
import { FetchContext, SourceFetcher } from './source-fetcher';

@Injectable()
export class UploadFetcher implements SourceFetcher {
  fetch(ctx: FetchContext): Promise<string> {
    // TODO: download service.archiveKey from MinIO and extract into ctx.workspace
    return Promise.resolve(ctx.workspace);
  }
}
