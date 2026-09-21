export const DeploymentSource = {
  MANUAL: 'MANUAL',
  GIT: 'GIT',
  RETRY: 'RETRY',
} as const;
export type DeploymentSource =
  (typeof DeploymentSource)[keyof typeof DeploymentSource];

export interface CreateDeployment {
  source?: DeploymentSource;
  branch?: string;
  commitHash?: string;
}

