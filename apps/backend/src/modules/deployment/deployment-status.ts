import type { PrismaService } from '@app/shared/services/prisma/prisma.service';
import { ConflictException } from '@nestjs/common';
import {
  DeploymentStatus,
  Prisma,
  type Deployment,
} from 'src/generated/prisma/client';

/** Single source of truth for legal deployment state transitions (BE-051). */
export const DEPLOYMENT_TRANSITIONS: Record<
  DeploymentStatus,
  DeploymentStatus[]
> = {
  QUEUED: ['PREPARING', 'FAILED', 'CANCELLED'],
  PREPARING: ['BUILDING', 'FAILED', 'CANCELLED'],
  BUILDING: ['DEPLOYING', 'FAILED', 'CANCELLED'],
  DEPLOYING: ['RUNNING', 'FAILED', 'CANCELLED'],
  RUNNING: [],
  FAILED: [],
  CANCELLED: [],
};

const LOG_MESSAGE: Partial<Record<DeploymentStatus, string>> = {
  PREPARING: 'Deployment started',
  BUILDING: 'Image build started',
  DEPLOYING: 'Deploying new container',
  RUNNING: 'Deployment running',
};

export function canTransition(
  from: DeploymentStatus,
  to: DeploymentStatus,
): boolean {
  return DEPLOYMENT_TRANSITIONS[from].includes(to);
}

/**
 * The only writer for forward deployment moves. Guards the edge, writes the
 * status (+ optional patch like startedAt/finishedAt) and the audit Log row
 * atomically. The FAILED sink (failDeployment) enforces the same map.
 */
export async function transitionDeployment(
  db: PrismaService,
  deploymentId: string,
  to: DeploymentStatus,
  patch: Prisma.DeploymentUpdateInput = {},
): Promise<Deployment> {
  const current = await db.deployment.findUniqueOrThrow({
    where: { id: deploymentId },
  });

  if (!canTransition(current.status, to)) {
    throw new ConflictException(
      `Illegal deployment transition: ${current.status} → ${to}`,
    );
  }

  const [updated] = await db.$transaction([
    db.deployment.update({
      where: { id: deploymentId },
      data: { status: to, ...patch },
    }),
    db.log.create({
      data: {
        message: LOG_MESSAGE[to] ?? `Deployment ${to.toLowerCase()}`,
        level: 'INFO',
        serviceId: current.serviceId,
        deploymentId,
      },
    }),
  ]);

  return updated;
}
