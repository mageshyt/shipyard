import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VolumeService } from './volume.service';
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
import { CreateVolumeDto } from './dto/create-volume.dto';
import { DockerVolumeDto } from './dto/volume-response.dto';

@Controller(ROUTES.DOCKER_VOLUME.CONTROLLER)
@ApiTags(ROUTES.DOCKER_VOLUME.TAGNAME)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VolumeController {
  constructor(private readonly volumeService: VolumeService) {}

  @Get(ROUTES.DOCKER_VOLUME.LIST)
  @ApiOperation({ summary: 'List all Docker volumes' })
  @ApiOkResponse({ type: [DockerVolumeDto] })
  listVolumes() {
    return this.volumeService.findAll();
  }

  @Post(ROUTES.DOCKER_VOLUME.CREATE)
  @ApiOperation({ summary: 'Create a Docker volume' })
  @ApiOkResponse({ type: DockerVolumeDto })
  createVolume(@Body() dto: CreateVolumeDto) {
    return this.volumeService.create(dto.name);
  }

  @Get(ROUTES.DOCKER_VOLUME.DETAIL)
  @ApiOperation({ summary: 'Get a volume by name' })
  @ApiParam({ name: 'name', description: 'Volume name' })
  @ApiOkResponse({ type: DockerVolumeDto })
  inspectVolume(@Param('name') name: string) {
    return this.volumeService.inspect(name);
  }

  @Delete(ROUTES.DOCKER_VOLUME.REMOVE)
  @ApiOperation({ summary: 'Remove a volume by name' })
  @ApiParam({ name: 'name', description: 'Volume name' })
  @ApiQuery({
    name: 'force',
    required: false,
    type: Boolean,
    description: 'Force removal even if the volume is in use',
  })
  removeVolume(
    @Param('name') name: string,
    @Query('force') force: boolean = false,
  ) {
    return this.volumeService.remove({ name, force });
  }
}
