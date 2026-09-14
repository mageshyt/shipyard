import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { CreateNetwork } from '@workspace/types';

export class CreateNetworkDto implements CreateNetwork {
  @ApiProperty({
    description: 'The name of the network to be created',
    example: 'my-network',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Owning project ID, recorded as a shipyard.projectId label',
    example: 'prj-1',
  })
  @IsOptional()
  @IsString()
  projectId?: string;
}
