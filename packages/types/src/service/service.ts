export const ServiceType = {
  APPLICATION: 'APPLICATION',
  CRON: 'CRON',
  STATIC: 'STATIC',
  DATABASE: 'DATABASE',
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

export const ServiceStatus = {
  CREATED: 'CREATED',
  BUILDING: 'BUILDING',
  DEPLOYING: 'DEPLOYING',
  RUNNING: 'RUNNING',
  STOPPED: 'STOPPED',
  FAILED: 'FAILED',
} as const;
export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];

export const BuildType = {
  DOCKER: 'DOCKER',
  NATIVE: 'NATIVE',
} as const;
export type BuildType = (typeof BuildType)[keyof typeof BuildType];

export const ServiceSource = {
  GIT: 'GIT',
  UPLOAD: 'UPLOAD',
  IMAGE: 'IMAGE',
} as const;
export type ServiceSource = (typeof ServiceSource)[keyof typeof ServiceSource];

export interface ServicePortMapping {
  host: number;
  container: number;
  protocol?: 'tcp' | 'udp';
}

export interface Service {
  id: string;
  name: string;
  slug: string | null;
  type: ServiceType;
  status: ServiceStatus;
  buildType: BuildType;
  source: ServiceSource;
  repositoryUrl: string | null;
  branch: string | null;
  archiveKey: string | null;
  imageRef: string | null;
  rootPath: string | null;
  dockerfilePath: string | null;
  dockerContextPath: string | null;
  buildCommand: string | null;
  startCommand: string | null;
  advancedConfig: Record<string, unknown> | null;
  ports: ServicePortMapping[] | null;
  projectId: string;
  /** ISO-8601 string over the wire (Prisma DateTime is serialized on the way out). */
  createdAt: string;
  /** ISO-8601 string over the wire (Prisma DateTime is serialized on the way out). */
  updatedAt: string;
}

export interface CreateService {
  projectId: string;
  name: string;
  type: ServiceType;
  buildType: BuildType;
  source?: ServiceSource;
  repositoryUrl?: string;
  branch?: string;
  archiveKey?: string;
  imageRef?: string;
  rootPath?: string;
  dockerfilePath?: string;
  dockerContextPath?: string;
  buildCommand?: string;
  startCommand?: string;
  advancedConfig?: Record<string, unknown>;
  ports?: ServicePortMapping[];
}

export type UpdateService = Partial<Omit<CreateService, 'projectId'>>;
