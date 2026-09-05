import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class ListContainerFilterParamsDto {
  @ApiPropertyOptional({
    description: 'All containers if true, otherwise only running containers',
    example: false,
  })
  @IsOptional()
  @IsIn([true, false])
  all?: boolean;

  @ApiPropertyOptional({
    description: 'Service ID to filter containers',
    example: 'service-123',
  })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'Project ID to filter containers',
    example: 'project-456',
  })
  @IsOptional()
  @IsString()
  projectId?: string;
}
