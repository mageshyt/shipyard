import { PartialType } from '@nestjs/swagger';
import type { UpdateProject } from '@workspace/types';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto
  extends PartialType(CreateProjectDto)
  implements UpdateProject {}
