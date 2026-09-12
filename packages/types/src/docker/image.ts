export interface ImageDescriptor {
  mediaType: string;
  digest: string;
  size: number;
}

export interface DockerImage {
  Id: string;
  ParentId: string;
  RepoTags?: string[];
  Created: number;
  Size: number;
  SharedSize: number;
  Containers: number;
  Labels: Record<string, string>;
  Descriptor?: ImageDescriptor;
}

export interface PullImage {
  fromImage: string;
  tag: string;
}

export interface PullImageResponse {
  fromImage: string;
  tag: string;
  message: string;
}
