import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import type {
  ContainerConfig,
  ContainerDetail,
  ContainerHealth,
  ContainerHostConfig,
  ContainerMount,
  ContainerNetworkSettings,
  ContainerState,
  PortBinding,
} from '@workspace/types';
import { ContainerNetworkInfoDto } from './docker-container.dto';

export class ContainerHealthDto implements ContainerHealth {
  @ApiProperty({ example: 'healthy' })
  @Expose()
  Status!: string;

  @ApiProperty({ example: 0 })
  @Expose()
  FailingStreak!: number;
}

export class ContainerStateDto implements ContainerState {
  @ApiProperty({ example: 'running' })
  @Expose()
  Status!: string;

  @ApiProperty()
  @Expose()
  Running!: boolean;

  @ApiProperty()
  @Expose()
  Paused!: boolean;

  @ApiProperty()
  @Expose()
  OOMKilled!: boolean;

  @ApiProperty()
  @Expose()
  Dead!: boolean;

  @ApiProperty({ example: 1234 })
  @Expose()
  Pid!: number;

  @ApiProperty({ example: 0 })
  @Expose()
  ExitCode!: number;

  @ApiProperty({ example: '' })
  @Expose()
  Error!: string;

  @ApiProperty({ example: '2026-09-05T14:07:08.000Z' })
  @Expose()
  StartedAt!: string;

  @ApiProperty({ example: '0001-01-01T00:00:00Z' })
  @Expose()
  FinishedAt!: string;

  @ApiPropertyOptional({ type: ContainerHealthDto })
  @Expose()
  @Type(() => ContainerHealthDto)
  Health?: ContainerHealthDto;
}

export class ContainerConfigDto implements ContainerConfig {
  @ApiProperty()
  @Expose()
  Image!: string;

  @ApiProperty({ type: [String], example: ['PATH=/usr/bin'] })
  @Expose()
  Env!: string[];

  @ApiProperty({ type: [String], example: ['node', 'server.js'] })
  @Expose()
  Cmd!: string[];

  @ApiProperty({ type: Object, example: {} })
  @Expose()
  Labels!: Record<string, string>;
}

export class PortBindingDto implements PortBinding {
  @ApiProperty({ example: '0.0.0.0' })
  @Expose()
  HostIp!: string;

  @ApiProperty({ example: '30000' })
  @Expose()
  HostPort!: string;
}

export class ContainerHostConfigDto implements ContainerHostConfig {
  @ApiProperty({
    type: PortBindingDto,
    isArray: true,
    description:
      'Port bindings, keyed by container port and protocol (e.g. "3000/tcp"). Swagger cannot express the map shape; actual response is an object keyed by port/protocol.',
  })
  @Expose()
  @Type(() => PortBindingDto)
  PortBindings!: Record<string, PortBindingDto[]>;

  @ApiProperty({ type: [String], example: ['/data:/app/data'] })
  @Expose()
  Binds?: string[];

  @ApiProperty({ example: 'bridge' })
  @Expose()
  NetworkMode?: string;

  @ApiPropertyOptional({ example: { Name: 'no', MaximumRetryCount: 0 } })
  @Expose()
  RestartPolicy?: { Name: string; MaximumRetryCount: number };
}

export class ContainerNetworkSettingsDto implements ContainerNetworkSettings {
  @ApiProperty({
    type: ContainerNetworkInfoDto,
    isArray: true,
    description:
      'Networks the container is attached to, keyed by network name. Swagger cannot express the map shape; actual response is an object keyed by network name.',
  })
  @Expose()
  @Type(() => ContainerNetworkInfoDto)
  Networks!: Record<string, ContainerNetworkInfoDto>;

  @ApiProperty({
    type: PortBindingDto,
    isArray: true,
    description:
      'Published ports, keyed by container port and protocol (e.g. "3000/tcp"). Swagger cannot express the map shape; actual response is an object keyed by port/protocol.',
  })
  @Expose()
  @Type(() => PortBindingDto)
  Ports!: Record<string, PortBindingDto[]>;
}

export class ContainerMountDto implements ContainerMount {
  @ApiProperty({ example: 'bind' })
  @Expose()
  Type!: string;

  @ApiPropertyOptional({ example: 'my-volume' })
  @Expose()
  Name?: string;

  @ApiProperty({ example: '/host/path' })
  @Expose()
  Source!: string;

  @ApiProperty({ example: '/container/path' })
  @Expose()
  Destination!: string;

  @ApiProperty({ example: 'rw' })
  @Expose()
  Mode!: string;

  @ApiProperty()
  @Expose()
  RW!: boolean;
}

export class ContainerDetailDto implements ContainerDetail {
  @ApiProperty()
  @Expose()
  Id!: string;

  @ApiProperty({ example: '/my-container' })
  @Expose()
  Name!: string;

  @ApiProperty({ example: '2026-09-05T14:07:07.992Z' })
  @Expose()
  Created!: string;

  @ApiProperty({ type: ContainerStateDto })
  @Expose()
  @Type(() => ContainerStateDto)
  State!: ContainerStateDto;

  @ApiProperty({ type: ContainerConfigDto })
  @Expose()
  @Type(() => ContainerConfigDto)
  Config!: ContainerConfigDto;

  @ApiProperty({ type: ContainerNetworkSettingsDto })
  @Expose()
  @Type(() => ContainerNetworkSettingsDto)
  NetworkSettings!: ContainerNetworkSettingsDto;

  @ApiProperty({ type: ContainerHostConfigDto })
  @Expose()
  @Type(() => ContainerHostConfigDto)
  HostConfig!: ContainerHostConfigDto;

  @ApiProperty({ type: [ContainerMountDto] })
  @Expose()
  @Type(() => ContainerMountDto)
  Mounts!: ContainerMountDto[];
}
