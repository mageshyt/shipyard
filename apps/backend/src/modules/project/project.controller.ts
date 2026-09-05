import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ROUTES } from '@app/core/constants';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/shared/auth';
import { GetUser } from '@app/shared/decorators';

@ApiTags(ROUTES.PROJECT.TAGNAME)
@Controller(ROUTES.PROJECT.CONTROLLER)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @Post(ROUTES.PROJECT.CREATE)
  create(
    @Body() createProjectDto: CreateProjectDto,
    @GetUser('id') userId: string,
  ) {
    return this.projectService.create(createProjectDto, userId);
  }

  @Get(ROUTES.PROJECT.LIST)
  findAll(@GetUser('id') userId: string) {
    return this.projectService.findAll(userId);
  }

  @Get(ROUTES.PROJECT.DETAIL)
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.projectService.findOne(id, userId);
  }

  @Patch(ROUTES.PROJECT.UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetUser('id') userId: string,
  ) {
    return this.projectService.update(id, updateProjectDto, userId);
  }

  @Delete(ROUTES.PROJECT.DELETE)
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.projectService.remove(id, userId);
  }
}
