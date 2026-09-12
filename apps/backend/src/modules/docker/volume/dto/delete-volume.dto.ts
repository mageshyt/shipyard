import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { DeleteVolume } from '@workspace/types';

export class DeleteVolumeDto implements DeleteVolume {
  @ApiProperty({
    description: 'The name of the volume to remove',
    example: 'shipyard-lazy-fox-data',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Force removal even if the volume is in use',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
