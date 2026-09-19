import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '@app/shared/services/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { generateSlug } from '@app/shared/util';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectService {
  constructor(private readonly db: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, ownerId: string) {
    try {
      return await this.db.project.create({
        data: {
          ...createProjectDto,
          slug: generateSlug(createProjectDto.name, 'Project name'),
          ownerId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `You already have a project named "${createProjectDto.name}"`,
        );
      }
      throw error;
    }
  }

  findAll(ownerId: string): Promise<Project[]> {
    return this.db.project.findMany({
      where: { ownerId },
    });
  }

  async findOne(id: string, ownerId: string): Promise<Project> {
    const project = await this.db.project.findUnique({
      where: { id, ownerId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    ownerId: string,
  ): Promise<Project> {
    try {
      return await this.db.project.update({
        where: { id, ownerId },
        data: {
          ...updateProjectDto,
          // only re-slug when the name actually changes (PartialType: name is optional)
          ...(updateProjectDto.name
            ? { slug: generateSlug(updateProjectDto.name, 'Project name') }
            : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `You already have a project named "${updateProjectDto.name}"`,
        );
      }
      throw error;
    }
  }

  async remove(id: string, ownerId: string) {
    try {
      return await this.db.project.delete({
        where: { id, ownerId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Project not found');
      }
      throw error;
    }
  }
}
