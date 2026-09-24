import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { CreateService, ServicePortMapping } from '@workspace/types';
import {
  BuildType,
  ServiceSource,
  ServiceType,
} from 'src/generated/prisma/client';

export class ServicePortMappingDto implements ServicePortMapping {
  @ApiProperty({ description: 'Host port to bind', example: 5433 })
  @IsInt()
  @Min(1)
  @Max(65535)
  host!: number;

  @ApiProperty({ description: 'Container port to expose', example: 5432 })
  @IsInt()
  @Min(1)
  @Max(65535)
  container!: number;

  @ApiPropertyOptional({ enum: ['tcp', 'udp'], default: 'tcp' })
  @IsOptional()
  @IsIn(['tcp', 'udp'])
  protocol?: 'tcp' | 'udp';
}

export class CreateServiceDto implements CreateService {
  @ApiProperty({ description: 'Owning project id', example: '01JABCDEF' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ description: 'Service name', example: 'api' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: ServiceType, example: ServiceType.APPLICATION })
  @IsEnum(ServiceType)
  type!: ServiceType;

  @ApiProperty({ enum: BuildType, example: BuildType.DOCKER })
  @IsEnum(BuildType)
  buildType!: BuildType;

  @ApiPropertyOptional({
    enum: ServiceSource,
    default: ServiceSource.GIT,
    description: 'Where the code comes from',
  })
  @IsOptional()
  @IsEnum(ServiceSource)
  source?: ServiceSource;

  @ApiPropertyOptional({
    description: 'Git clone URL (required when source = GIT)',
    example: 'https://github.com/acme/api.git',
  })
  @IsOptional()
  @IsString()
  repositoryUrl?: string;

  @ApiPropertyOptional({ description: 'Branch to deploy', example: 'main' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({
    description:
      'Object key of the uploaded archive (required when source = UPLOAD)',
    example: 'uploads/svc_01J/source.zip',
  })
  @IsOptional()
  @IsString()
  archiveKey?: string;

  @ApiPropertyOptional({
    description: 'Prebuilt image reference (required when source = IMAGE)',
    example: 'nginx:alpine',
  })
  @IsOptional()
  @IsString()
  imageRef?: string;

  @ApiPropertyOptional({ example: './', description: 'Build context root' })
  @IsOptional()
  @IsString()
  rootPath?: string;

  @ApiPropertyOptional({
    example: 'Dockerfile',
    description: 'Path to the Dockerfile',
  })
  @IsOptional()
  @IsString()
  dockerfilePath?: string;

  @ApiPropertyOptional({
    example: './',
    description: 'Docker build context path',
  })
  @IsOptional()
  @IsString()
  dockerContextPath?: string;

  @ApiPropertyOptional({ example: 'npm run build' })
  @IsOptional()
  @IsString()
  buildCommand?: string;

  @ApiPropertyOptional({ example: 'node dist/main.js' })
  @IsOptional()
  @IsString()
  startCommand?: string;

  @ApiPropertyOptional({ description: 'Free-form advanced configuration' })
  @IsOptional()
  @IsObject()
  advancedConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Published ports for non-HTTP reachability (HTTP goes through Traefik)',
    type: [ServicePortMappingDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicePortMappingDto)
  ports?: ServicePortMappingDto[];
}
