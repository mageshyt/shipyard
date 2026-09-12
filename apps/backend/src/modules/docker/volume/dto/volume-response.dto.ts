import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import type { DockerVolume, VolumeUsageData } from '@workspace/types';

export class VolumeUsageDataDto implements VolumeUsageData {
  @ApiProperty({ example: 0 })
  @Expose()
  Size!: number;

  @ApiProperty({ example: 1 })
  @Expose()
  RefCount!: number;
}

export class DockerVolumeDto implements DockerVolume {
  @ApiProperty({ example: 'shipyard-lazy-fox-data' })
  @Expose()
  Name!: string;

  @ApiProperty({ example: 'local' })
  @Expose()
  Driver!: string;

  @ApiProperty({
    example: '/var/lib/docker/volumes/shipyard-lazy-fox-data/_data',
  })
  @Expose()
  Mountpoint!: string;

  @ApiPropertyOptional({ example: '2026-09-05T14:07:07.992Z' })
  @Expose()
  CreatedAt?: string;

  @ApiProperty({ type: Object, example: { 'created-by': 'shipyard-api' } })
  @Expose()
  Labels!: Record<string, string>;

  @ApiProperty({ example: 'local' })
  @Expose()
  Scope!: string;

  @ApiProperty({ type: Object, nullable: true, example: {} })
  @Expose()
  Options!: Record<string, string> | null;

  @ApiPropertyOptional({ type: VolumeUsageDataDto, nullable: true })
  @Expose()
  @Type(() => VolumeUsageDataDto)
  UsageData?: VolumeUsageDataDto | null;
}
