import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import type { CreateVolume } from '@workspace/types';

export class CreateVolumeDto implements CreateVolume {
  @ApiProperty({
    description: 'The name of the volume to create',
    example: 'data',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
