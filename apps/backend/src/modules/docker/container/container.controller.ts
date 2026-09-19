import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Sse,
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
import { SkipStandardResponse } from '@app/shared/decorators';
import { ListContainerFilterParamsDto } from './dto/listcontainer-filter.dto';
import {
  ContainerActionDto,
  ContainerTimeoutDto,
  DockerContainerDto,
  KillContainerDto,
} from './dto/docker-container.dto';
import { ContainerDetailDto } from './dto/container-detail.dto';
import { CreateContainerDto } from './dto/create-container.dto';

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

  @Post(ROUTES.DOCKER_CONTAINERS.CREATE)
  @ApiOperation({ summary: 'Create a new container' })
  @ApiOkResponse({ type: ContainerDetailDto })
  async createContainer(@Body() dto: CreateContainerDto) {
    return this.containerService.createContainer(dto);
  }

  @Get(ROUTES.DOCKER_CONTAINERS.DETAIL)
  @ApiOperation({ summary: 'Get a container by ID' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  @ApiOkResponse({ type: ContainerDetailDto })
  async getContainer(@Param('id') id: string) {
    return this.containerService.findContainerById(id);
  }

  @Sse(ROUTES.DOCKER_CONTAINERS.LOGS)
  @SkipStandardResponse()
  @ApiOperation({ summary: 'Stream container logs' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  @ApiQuery({
    name: 'tail',
    required: false,
    type: Number,
    description:
      'Number of historical lines to send before following (0 = only new lines)',
  })
  async streamContainerLogs(
    @Param('id') id: string,
    @Query('tail', new DefaultValuePipe(100), ParseIntPipe) tail: number,
  ) {
    return this.containerService.streamContainerLogs(id, tail);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.START)
  @ApiOperation({ summary: 'Start a container' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  @ApiOkResponse({ type: ContainerActionDto })
  async startContainer(@Param('id') id: string) {
    return this.containerService.startContainer(id);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.STOP)
  @ApiOperation({ summary: 'Stop a container' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  @ApiOkResponse({ type: ContainerActionDto })
  async stopContainer(
    @Param('id') id: string,
    @Body() dto: ContainerTimeoutDto,
  ) {
    return this.containerService.stopContainer(id, dto.t);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.RESTART)
  @ApiOperation({ summary: 'Restart a container' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  @ApiOkResponse({ type: ContainerActionDto })
  async restartContainer(
    @Param('id') id: string,
    @Body() dto: ContainerTimeoutDto,
  ) {
    return this.containerService.restartContainer(id, dto.t);
  }

  @Post(ROUTES.DOCKER_CONTAINERS.KILL)
  @ApiOperation({ summary: 'Kill a container with an optional signal' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  @ApiOkResponse({ type: ContainerActionDto })
  async killContainer(@Param('id') id: string, @Body() dto: KillContainerDto) {
    return this.containerService.killContainer(id, dto.signal);
  }

  @Delete(ROUTES.DOCKER_CONTAINERS.REMOVE)
  @ApiOperation({ summary: 'Remove a container' })
  @ApiParam({ name: 'id', description: 'Container ID or name' })
  @ApiOkResponse({ type: ContainerActionDto })
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
