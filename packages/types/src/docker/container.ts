export type ContainerKillSignal = 'SIGTERM' | 'SIGKILL';

export interface ContainerPort {
  IP: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: string;
}

export interface ContainerNetworkInfo {
  NetworkID: string;
  Gateway: string;
  IPAddress: string;
  MacAddress: string;
}

export interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  State: string;
  Status: string;
  Ports: ContainerPort[];
  Labels: Record<string, string>;
  NetworkSettings: { Networks: Record<string, ContainerNetworkInfo> };
}

export interface ContainerAction {
  id: string;
  status: string;
}

export interface KillContainer {
  signal?: ContainerKillSignal;
}

export interface ListContainerFilterParams {
  all?: boolean;
  serviceId?: string;
  projectId?: string;
}

export interface ContainerHealth {
  Status: string;
  FailingStreak: number;
}

export interface ContainerState {
  Status: string;
  Running: boolean;
  Paused: boolean;
  OOMKilled: boolean;
  Dead: boolean;
  Pid: number;
  ExitCode: number;
  Error: string;
  StartedAt: string;
  FinishedAt: string;
  Health?: ContainerHealth;
}

export interface ContainerConfig {
  Image: string;
  Env: string[];
  Cmd: string[];
  Labels: Record<string, string>;
}

export interface PortBinding {
  HostIp: string;
  HostPort: string;
}

export interface ContainerHostConfig {
  PortBindings: Record<string, PortBinding[]>;
  Binds?: string[];
  NetworkMode?: string;
  RestartPolicy?: { Name: string; MaximumRetryCount: number };
}

export interface ContainerNetworkSettings {
  Networks: Record<string, ContainerNetworkInfo>;
  Ports: Record<string, PortBinding[]>;
}

export interface ContainerMount {
  Type: string;
  Name?: string;
  Source: string;
  Destination: string;
  Mode: string;
  RW: boolean;
}

export interface ContainerDetail {
  Id: string;
  Name: string;
  Created: string;
  State: ContainerState;
  Config: ContainerConfig;
  NetworkSettings: ContainerNetworkSettings;
  HostConfig: ContainerHostConfig;
  Mounts: ContainerMount[];
}

export interface CreateContainerPort {
  host: number;
  container: number;
  protocol?: 'tcp' | 'udp';
}

export interface CreateContainerVolume {
  name: string;
  target: string;
  readOnly?: boolean;
}

export interface CreateContainer {
  image: string;
  serviceId?: string;
  projectId?: string;
  deploymentId?: string;
  name?: string;
  env?: string[];
  ports?: CreateContainerPort[];
  volumes?: CreateContainerVolume[];
  network?: string;
  cmd?: string[];
}
