export interface VolumeUsageData {
  Size: number;
  RefCount: number;
}

export interface DockerVolume {
  Name: string;
  Driver: string;
  Mountpoint: string;
  CreatedAt?: string;
  Labels: Record<string, string>;
  Scope: string;
  Options: Record<string, string> | null;
  UsageData?: VolumeUsageData | null;
}

export interface CreateVolume {
  name: string;
  serviceId?: string;
}

export interface DeleteVolume {
  name: string;
  force?: boolean;
}
