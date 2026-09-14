import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import type {
  DockerImage,
  ImageDescriptor,
  PullImageResponse,
  RemoveImageResponse,
} from '@workspace/types';

export class ImageDescriptorDto implements ImageDescriptor {
  @ApiProperty({ example: 'application/vnd.oci.image.manifest.v1+json' })
  @Expose()
  mediaType!: string;

  @ApiProperty({ example: 'sha256:abc123' })
  @Expose()
  digest!: string;

  @ApiProperty({ example: 1234 })
  @Expose()
  size!: number;
}

export class DockerImageDto implements DockerImage {
  @ApiProperty()
  @Expose()
  Id!: string;

  @ApiProperty()
  @Expose()
  ParentId!: string;

  @ApiPropertyOptional({ type: [String], example: ['nginx:latest'] })
  @Expose()
  RepoTags?: string[];

  @ApiProperty({ example: 1725534000 })
  @Expose()
  Created!: number;

  @ApiProperty({ example: 187000000 })
  @Expose()
  Size!: number;

  @ApiProperty({ example: 0 })
  @Expose()
  SharedSize!: number;

  @ApiProperty({ example: 0 })
  @Expose()
  Containers!: number;

  @ApiProperty({ type: Object, example: {} })
  @Expose()
  Labels!: Record<string, string>;

  @ApiPropertyOptional({ type: ImageDescriptorDto })
  @Expose()
  @Type(() => ImageDescriptorDto)
  Descriptor?: ImageDescriptorDto;
}

export class PullImageResponseDto implements PullImageResponse {
  @ApiProperty({ example: 'nginx' })
  @Expose()
  fromImage!: string;

  @ApiProperty({ example: 'latest' })
  @Expose()
  tag!: string;

  @ApiProperty({ example: 'Successfully pulled image nginx:latest' })
  @Expose()
  message!: string;
}

export class RemoveImageResponseDto implements RemoveImageResponse {
  @ApiProperty({ example: 'sha256:111' })
  @Expose()
  id!: string;

  @ApiProperty({ example: true })
  @Expose()
  removed!: boolean;
}
