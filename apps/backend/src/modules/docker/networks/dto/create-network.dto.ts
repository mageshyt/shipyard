import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import type { CreateNetwork } from '@workspace/types';

export class CreateNetworkDto implements CreateNetwork {
  @ApiProperty({
    description: 'The name of the network to be created',
    example: 'my-network',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
