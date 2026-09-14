import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { CreateVolume } from '@workspace/types';

export class CreateVolumeDto implements CreateVolume {
  @ApiProperty({
    description: 'The name of the volume to create',
    example: 'data',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Owning service ID, recorded as a shipyard.serviceId label',
    example: 'svc-1',
  })
  @IsOptional()
  @IsString()
  serviceId?: string;
}
