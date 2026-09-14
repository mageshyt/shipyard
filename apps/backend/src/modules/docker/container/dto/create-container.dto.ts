import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  CreateContainer,
  CreateContainerPort,
  CreateContainerVolume,
} from '@workspace/types';

export class CreateContainerPortDto implements CreateContainerPort {
  @ApiProperty({ description: 'Host port to bind', example: 3001 })
  @IsInt()
  @Min(1)
  @Max(65535)
  host!: number;

  @ApiProperty({ description: 'Container port to expose', example: 3000 })
  @IsInt()
  @Min(1)
  @Max(65535)
  container!: number;

  @ApiPropertyOptional({
    description: 'Port protocol',
    enum: ['tcp', 'udp'],
    default: 'tcp',
  })
  @IsOptional()
  @IsIn(['tcp', 'udp'])
  protocol?: 'tcp' | 'udp';
}

export class CreateContainerVolumeDto implements CreateContainerVolume {
  @ApiProperty({
    description: 'Name of the volume to mount',
    example: 'shipyard-data',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Mount path inside the container',
    example: '/data',
  })
  @IsString()
  @IsNotEmpty()
  target!: string;

  @ApiPropertyOptional({
    description: 'Mount the volume read-only',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  readOnly?: boolean;
}

export class CreateContainerDto implements CreateContainer {
  @ApiProperty({
    description: 'Image to create the container from',
    example: 'node:20-alpine',
  })
  @IsString()
  @IsNotEmpty()
  image!: string;

  @ApiPropertyOptional({ description: 'Owning service ID', example: 'svc-1' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Owning project ID', example: 'prj-1' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Deployment ID', example: 'dep-1' })
  @IsOptional()
  @IsString()
  deploymentId?: string;

  @ApiPropertyOptional({
    description:
      'Container name; generated when omitted. Lowercase letters, digits, and _.- only',
    example: 'shipyard-api-a3f9',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9_.-]*$/, {
    message:
      'name must start with a letter or digit and contain only lowercase letters, digits, _, . or -',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Environment variables as KEY=value entries',
    type: [String],
    example: ['NODE_ENV=production', 'PORT=3000'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(256)
  env?: string[];

  @ApiPropertyOptional({
    description: 'Port mappings',
    type: [CreateContainerPortDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContainerPortDto)
  ports?: CreateContainerPortDto[];

  @ApiPropertyOptional({
    description: 'Volume mounts',
    type: [CreateContainerVolumeDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContainerVolumeDto)
  volumes?: CreateContainerVolumeDto[];

  @ApiPropertyOptional({
    description: 'Network to attach the container to',
    example: 'shipyard-myproject',
  })
  @IsOptional()
  @IsString()
  network?: string;

  @ApiPropertyOptional({
    description: 'Override the container command',
    type: [String],
    example: ['node', 'dist/main.js'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cmd?: string[];
}
