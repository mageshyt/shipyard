import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { ROUTES } from '@app/core/constants';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/shared/auth';
import { PullImageDto } from './dto/pull-image.dto';
import { DockerImageDto, PullImageResponseDto } from './dto/image-response.dto';

@Controller(ROUTES.DOCKER_IMAGE.CONTROLLER)
@ApiTags(ROUTES.DOCKER_IMAGE.TAGNAME)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get(ROUTES.DOCKER_IMAGE.LIST)
  @ApiOperation({ summary: 'List all Docker images' })
  @ApiOkResponse({ type: [DockerImageDto] })
  findAll() {
    return this.imagesService.findAll();
  }

  @Post(ROUTES.DOCKER_IMAGE.PULL)
  @ApiOperation({ summary: 'Pull a Docker image' })
  @ApiOkResponse({ type: PullImageResponseDto })
  pullImage(@Body() dto: PullImageDto) {
    return this.imagesService.pullImage(dto);
  }

  @Delete(ROUTES.DOCKER_IMAGE.REMOVE)
  @ApiOperation({ summary: 'Remove a Docker image by ID' })
  @ApiParam({ name: 'id', description: 'Image ID or name' })
  remove(@Param('id') id: string) {
    return this.imagesService.remove(id);
  }
}
