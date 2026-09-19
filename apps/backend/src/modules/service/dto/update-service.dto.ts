import { OmitType, PartialType } from '@nestjs/swagger';
import type { UpdateService } from '@workspace/types';
import { CreateServiceDto } from './create-service.dto';

export class UpdateServiceDto
  extends PartialType(OmitType(CreateServiceDto, ['projectId'] as const))
  implements UpdateService {}
