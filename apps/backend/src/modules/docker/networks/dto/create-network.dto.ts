import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNetworkDto {
  @ApiProperty({
    description: 'The name of the network to be created',
    example: 'my-network',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
