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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/shared/auth';
import { ListContainerFilterParamsDto } from './dto/listcontainer-filter.dto';
import {
  DockerContainerDto,
  KillContainerDto,
} from './dto/docker-container.dto';

@Controller(ROUTES.DOCKER_CONTAINERS.CONTROLLER)
@ApiTags(ROUTES.DOCKER_CONTAINERS.TAGNAME)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContainerController {
  constructor(private readonly containerService: ContainerService) {}

  @Get(ROUTES.DOCKER_CONTAINERS.LIST)
  @ApiOperation({ summary: 'List containers, optionally filtered' })
  @ApiOkResponse({ type: [DockerContainerDto] })
  async listContainers(@Query() filters: ListContainerFilterParamsDto) {
    return this.containerService.listContainers(filters);
  }

  @Get(ROUTES.DOCKER_CONTAINERS.DETAIL)
  @ApiOperation({ summary: 'Get a container by ID' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  async getContainer(@Param('id') id: string) {
    return this.containerService.findContainerById(id);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.START)
  @ApiOperation({ summary: 'Start a container' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  async startContainer(@Param('id') id: string) {
    return this.containerService.startContainer(id);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.STOP)
  @ApiOperation({ summary: 'Stop a container' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  async stopContainer(@Param('id') id: string) {
    return this.containerService.stopContainer(id);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.RESTART)
  @ApiOperation({ summary: 'Restart a container' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  async restartContainer(@Param('id') id: string) {
    return this.containerService.restartContainer(id);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.KILL)
  @ApiOperation({ summary: 'Kill a container with an optional signal' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  async killContainer(@Param('id') id: string, @Body() dto: KillContainerDto) {
    return this.containerService.killContainer(id, dto.signal);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.REMOVE)
  @ApiOperation({ summary: 'Remove a container' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  @ApiQuery({
    name: 'force',
    required: false,
    type: Boolean,
    description: 'Force remove a running container',
  })
  @ApiQuery({
    name: 'v',
    required: false,
    type: Boolean,
    description: 'Remove anonymous volumes',
  })
  async removeContainer(
    @Param('id') id: string,
    @Query('force') force: boolean = false,
    @Query('v') removeVolumes: boolean = false,
  ) {
    return this.containerService.removeContainer(id, force, removeVolumes);
  }
}
