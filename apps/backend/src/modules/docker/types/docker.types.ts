export interface DockerHealth {
  reachable: boolean;
  serverVersion: string;
  apiVersion: string;
  containers: { total: number; running: number; stopped: number };
  images: number;
}
