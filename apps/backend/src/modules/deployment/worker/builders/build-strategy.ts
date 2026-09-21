import { Deployment, Service } from 'src/generated/prisma/client';

export interface BuildContext {
  deployment: Deployment;
  service: Service;
  sourceDir: string; // path to the source code directory
  imageTag: string; // tag for the built image (shipyard/{slug}:{deploymentId})
  buildArgs: Record<string, string>; // scope BUILD/BOTH vars, empty when none
}

export interface BuildStrategy {
  build(ctx: BuildContext): Promise<string>; // reutrn the built image reference (e.g., shipyard/{slug}:{deploymentId})
}
