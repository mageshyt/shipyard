import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ROUTES } from '@app/core/constants';
import { JwtAuthGuard } from '@app/shared/auth';
import { GetUser } from '@app/shared/decorators';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ListServiceQueryDto } from './dto/list-service.dto';

@ApiTags(ROUTES.SERVICE.TAGNAME)
@Controller(ROUTES.SERVICE.CONTROLLER)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post(ROUTES.SERVICE.CREATE)
  create(
    @Body() createServiceDto: CreateServiceDto,
    @GetUser('id') userId: string,
  ) {
    return this.serviceService.create(createServiceDto, userId);
  }

  @Get(ROUTES.SERVICE.LIST)
  findAll(@Query() query: ListServiceQueryDto, @GetUser('id') userId: string) {
    return this.serviceService.findAll(userId, query);
  }

  @Get(ROUTES.SERVICE.DETAIL)
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.serviceService.findOne(id, userId);
  }

  @Patch(ROUTES.SERVICE.UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @GetUser('id') userId: string,
  ) {
    return this.serviceService.update(id, updateServiceDto, userId);
  }

  @Delete(ROUTES.SERVICE.DELETE)
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.serviceService.remove(id, userId);
  }
}
