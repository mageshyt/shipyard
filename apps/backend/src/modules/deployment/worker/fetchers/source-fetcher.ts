import { Deployment, Service } from 'src/generated/prisma/client';

export interface FetchContext {
  deployment: Deployment;
  service: Service;
  workspace: string; // pre-deployed temp dir
  signal?: AbortSignal;
}

export interface SourceFetcher {
  fetch(ctx: FetchContext): Promise<string>; // returns the path to the build directory
}
