import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import type {
  ContainerAction,
  ContainerKillSignal,
  ContainerNetworkInfo,
  ContainerPort,
  DockerContainer,
  KillContainer,
} from '@workspace/types';

export class ContainerPortDto implements ContainerPort {
  @ApiProperty({ example: '0.0.0.0' })
  @Expose()
  IP!: string;

  @ApiProperty({ example: 3000 })
  @Expose()
  PrivatePort!: number;

  @ApiPropertyOptional({ example: 30000 })
  @Expose()
  PublicPort?: number;

  @ApiProperty({ example: 'tcp' })
  @Expose()
  Type!: string;
}

export class ContainerNetworkInfoDto implements ContainerNetworkInfo {
  @ApiProperty()
  @Expose()
  NetworkID!: string;

  @ApiProperty({ example: '172.20.0.1' })
  @Expose()
  Gateway!: string;

  @ApiProperty({ example: '172.20.0.2' })
  @Expose()
  IPAddress!: string;

  @ApiProperty({ example: '02:42:ac:14:00:02' })
  @Expose()
  MacAddress!: string;
}

export class DockerContainerDto implements DockerContainer {
  @ApiProperty()
  @Expose()
  Id!: string;

  @ApiProperty({ type: [String] })
  @Expose()
  Names!: string[];

  @ApiProperty()
  @Expose()
  Image!: string;

  @ApiProperty()
  @Expose()
  ImageID!: string;

  @ApiProperty()
  @Expose()
  Command!: string;

  @ApiProperty()
  @Expose()
  Created!: number;

  @ApiProperty()
  @Expose()
  State!: string;

  @ApiProperty()
  @Expose()
  Status!: string;

  @ApiProperty({ type: [ContainerPortDto] })
  @Expose()
  @Type(() => ContainerPortDto)
  Ports!: ContainerPortDto[];

  @ApiProperty({ type: Object, example: {} })
  @Expose()
  Labels!: Record<string, string>;

  @ApiProperty({
    type: ContainerNetworkInfoDto,
    isArray: true,
    description:
      'Networks the container is attached to, keyed by network name. Swagger cannot express the map shape; actual response is an object keyed by network name.',
  })
  @Expose()
  @Type(() => ContainerNetworkInfoDto)
  NetworkSettings!: { Networks: Record<string, ContainerNetworkInfoDto> };
}

export class ContainerActionDto implements ContainerAction {
  @ApiProperty({ description: 'Container ID' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'started' })
  @Expose()
  status!: string;
}

export const CONTAINER_KILL_SIGNALS = {
  SIGTERM: 'SIGTERM',
  SIGKILL: 'SIGKILL',
} as const;

export class KillContainerDto implements KillContainer {
  @ApiProperty({
    enum: Object.values(CONTAINER_KILL_SIGNALS),
    description: 'Signal to send to the container',
    default: CONTAINER_KILL_SIGNALS.SIGTERM,
  })
  @Expose()
  @IsOptional()
  @IsEnum(CONTAINER_KILL_SIGNALS)
  signal: ContainerKillSignal = CONTAINER_KILL_SIGNALS.SIGTERM;
}
