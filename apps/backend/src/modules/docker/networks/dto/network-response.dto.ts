import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class NetworkIpamConfigDto {
  @ApiProperty({ example: '172.20.0.0/16' })
  @Expose()
  Subnet!: string;

  @ApiProperty({ example: '172.20.0.1' })
  @Expose()
  Gateway!: string;
}

export class NetworkIpamDto {
  @ApiProperty({ example: 'default' })
  @Expose()
  Driver!: string;

  @ApiProperty({ type: [NetworkIpamConfigDto] })
  @Expose()
  @Type(() => NetworkIpamConfigDto)
  Config!: NetworkIpamConfigDto[];
}

export class NetworkContainerDto {
  @ApiProperty({ example: 'my-container' })
  @Expose()
  Name!: string;

  @ApiProperty({ description: 'Container ID (the object key)' })
  EndpointID!: string;

  @ApiProperty({ example: '172.20.0.2/16' })
  @Expose()
  IPv4Address!: string;

  @ApiProperty({ example: '' })
  @Expose()
  IPv6Address!: string;
}

export class NetworkResponseDto {
  @ApiProperty()
  @Expose()
  Id!: string;

  @ApiProperty({ example: 'docker_gwbridge' })
  @Expose()
  Name!: string;

  @ApiProperty({ example: '2026-09-05T14:07:07.992Z' })
  @Expose()
  Created!: string;

  @ApiProperty({ example: 'local' })
  @Expose()
  Scope!: string;

  @ApiProperty({ example: 'bridge' })
  @Expose()
  Driver!: string;

  @ApiProperty({ type: NetworkIpamDto })
  @Expose()
  @Type(() => NetworkIpamDto)
  IPAM!: NetworkIpamDto;

  @ApiProperty()
  @Expose()
  Internal!: boolean;

  @ApiProperty()
  @Expose()
  Attachable!: boolean;

  @ApiProperty()
  @Expose()
  Ingress!: boolean;

  @ApiProperty({ type: Object, example: {} })
  @Expose()
  Labels!: Record<string, string>;

  @ApiPropertyOptional({
    type: NetworkContainerDto,
    isArray: true,
    description:
      'Attached containers, keyed by container ID (inspect only). Swagger cannot express the map shape; actual response is an object keyed by container ID.',
  })
  @Expose()
  @Type(() => NetworkContainerDto)
  Containers?: Record<string, NetworkContainerDto>;
}
