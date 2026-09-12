import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import type { PullImage } from '@workspace/types';

export class PullImageDto implements PullImage {
  @ApiProperty({
    description: 'The name of the image to pull, without the tag',
    example: 'nginx',
  })
  @IsNotEmpty()
  @IsString()
  fromImage!: string;

  @ApiProperty({
    description: 'The tag of the image to pull',
    example: 'latest',
  })
  @IsNotEmpty()
  @IsString()
  tag!: string;
}
