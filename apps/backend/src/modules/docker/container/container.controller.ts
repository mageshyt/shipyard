import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContainerService } from './container.service';
import { ROUTES } from '@app/core/constants';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/shared/auth';
import { ListContainerFilterParamsDto } from './dto/listcontainer-filter.dto';
import { KillContainerDto } from './dto/docker-container.dto';

@Controller(ROUTES.DOCKER_CONTAINERS.CONTROLLER)
@ApiTags(ROUTES.DOCKER_CONTAINERS.TAGNAME)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContainerController {
  constructor(private readonly containerService: ContainerService) {}

  @Get(ROUTES.DOCKER_CONTAINERS.LIST)
  async listContainers(@Query() filters: ListContainerFilterParamsDto) {
    return this.containerService.listContainers(filters);
  }

  @Get(ROUTES.DOCKER_CONTAINERS.DETAIL)
  async getContainer(@Param('id') id: string) {
    return this.containerService.findContainerById(id);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.START)
  async startContainer(@Param('id') id: string) {
    return this.containerService.startContainer(id);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.STOP)
  async stopContainer(@Param('id') id: string) {
    return this.containerService.stopContainer(id);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.RESTART)
  async restartContainer(@Param('id') id: string) {
    return this.containerService.restartContainer(id);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.KILL)
  async killContainer(@Param('id') id: string, @Body() dto: KillContainerDto) {
    return this.containerService.killContainer(id, dto.signal);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.REMOVE)
  async removeContainer(
    @Param('id') id: string,
    @Query('force') force: boolean = false,
    @Query('v') removeVolumes: boolean = false,
  ) {
    return this.containerService.removeContainer(id, force, removeVolumes);
  }
}
