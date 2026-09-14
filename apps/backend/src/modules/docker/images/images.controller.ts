import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/shared/auth';
import { PullImageDto } from './dto/pull-image.dto';
import {
  DockerImageDto,
  PullImageResponseDto,
  RemoveImageResponseDto,
} from './dto/image-response.dto';

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
  @ApiQuery({
    name: 'force',
    required: false,
    type: Boolean,
    description: 'Force removal even if the image is in use',
  })
  @ApiOkResponse({ type: RemoveImageResponseDto })
  remove(@Param('id') id: string, @Query('force') force: boolean = false) {
    return this.imagesService.remove(id, force);
  }
}
