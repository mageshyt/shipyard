export interface NetworkIpamConfig {
  Subnet: string;
  Gateway: string;
}

export interface NetworkIpam {
  Driver: string;
  Config: NetworkIpamConfig[];
}

export interface NetworkContainer {
  Name: string;
  EndpointID: string;
  IPv4Address: string;
  IPv6Address: string;
}

export interface NetworkResponse {
  Id: string;
  Name: string;
  Created: string;
  Scope: string;
  Driver: string;
  IPAM: NetworkIpam;
  Internal: boolean;
  Attachable: boolean;
  Ingress: boolean;
  Labels: Record<string, string>;
  Containers?: Record<string, NetworkContainer>;
}

export interface CreateNetwork {
  name: string;
  projectId?: string;
}

export interface NetworkConnectionResponse {
  networkId: string;
  containerId: string;
  status: 'connected' | 'disconnected';
}
