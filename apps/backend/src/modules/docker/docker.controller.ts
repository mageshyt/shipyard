import { Controller, Get, UseGuards } from '@nestjs/common';
import { DockerService } from './docker.service';
import { ROUTES } from '@app/core/constants';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/shared/auth';
import { DockerHealth } from './types/docker.types';

@Controller(ROUTES.DOCKER.CONTROLLER)
@ApiTags(ROUTES.DOCKER.TAGNAME)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DockerController {
  constructor(private readonly dockerService: DockerService) {}

  @Get(ROUTES.DOCKER.HEALTH)
  @ApiOperation({ summary: 'Ping Docker daemon and get health info' })
  async pingDocker(): Promise<DockerHealth> {
    return this.dockerService.pingDocker();
  }

  @Get(ROUTES.DOCKER.LIST_IMAGES)
  @ApiOperation({ summary: 'List all Docker images' })
  async listImages() {
    return this.dockerService.listImages();
  }
}
