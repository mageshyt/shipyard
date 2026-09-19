import type { DefaultJobOptions } from 'bullmq';

export const DEPLOYMENTS_QUEUE = 'deployments';

export const DEPLOY_JOB_NAME = 'deploy';

export const QUEUE_READY_TIMEOUT_MS = 10_000;

export const DEPLOYMENT_JOB_DEFAULTS: DefaultJobOptions = {
  attempts: 1,
  removeOnComplete: 100,
  removeOnFail: 500,
};

export const DEPLOYMENT_TIMEOUT_MS = 30 * 60 * 1000;

export const DEPLOYMENT_WORKER_CONCURRENCY = Number(
  process.env.DEPLOYMENT_WORKER_CONCURRENCY ?? 3,
);
