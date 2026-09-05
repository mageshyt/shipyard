import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export class DockerContainerDto {
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
}

export enum ContainerKillSignal {
  SIGTERM = 'SIGTERM',
  SIGKILL = 'SIGKILL',
}

export class KillContainerDto {
  @ApiProperty({
    enum: ContainerKillSignal,
    description: 'Signal to send to the container',
    default: ContainerKillSignal.SIGTERM,
  })
  @Expose()
  @IsOptional()
  @IsEnum(ContainerKillSignal)
  signal: ContainerKillSignal = ContainerKillSignal.SIGTERM;
}
