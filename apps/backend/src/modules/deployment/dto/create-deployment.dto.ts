import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { CreateDeployment } from '@workspace/types';
import { DeploymentSource } from 'src/generated/prisma/client';

export class CreateDeploymentDto implements CreateDeployment {
  @ApiPropertyOptional({
    enum: DeploymentSource,
    default: DeploymentSource.MANUAL,
    description:
      'What triggered this deployment. Defaults to MANUAL; RETRY is set by the retry endpoint.',
  })
  @IsOptional()
  @IsEnum(DeploymentSource)
  source?: DeploymentSource;

  @ApiPropertyOptional({
    description:
      'Branch to deploy. Falls back to the service default branch. Ignored for UPLOAD/IMAGE sources.',
    example: 'main',
  })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({
    description:
      'Optional pin to an exact commit. When omitted, the worker resolves and records the latest SHA at PREPARE time.',
    example: 'a3f9c1e',
  })
  @IsOptional()
  @IsString()
  commitHash?: string;
}
