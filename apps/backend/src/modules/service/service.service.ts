import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@app/shared/services/prisma/prisma.service';
import { generateSlug } from '@app/shared/util';
import { Prisma, ServiceSource } from 'src/generated/prisma/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ListServiceQueryDto } from './dto/list-service.dto';
import { Service } from './entities/service.entity';
import { ConfigService } from '@nestjs/config';

interface SourceConfig {
  repositoryUrl?: string | null;
  archiveKey?: string | null;
  imageRef?: string | null;
}

@Injectable()
export class ServiceService {
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateServiceDto, ownerId: string): Promise<Service> {
    await this.assertProjectOwned(dto.projectId, ownerId);

    const source = dto.source ?? ServiceSource.GIT;
    this.assertSourceConfig(source, dto);

    try {
      const { service } = await this.db.$transaction(async (tx) => {
        const created = await tx.service.create({
          data: {
            name: dto.name,
            slug: generateSlug(dto.name, 'Service name'),
            type: dto.type,
            buildType: dto.buildType,
            source,
            repositoryUrl: dto.repositoryUrl,
            branch: dto.branch,
            archiveKey: dto.archiveKey,
            imageRef: dto.imageRef,
            rootPath: dto.rootPath,
            dockerfilePath: dto.dockerfilePath,
            dockerContextPath: dto.dockerContextPath,
            buildCommand: dto.buildCommand,
            startCommand: dto.startCommand,
            advancedConfig: dto.advancedConfig as Prisma.InputJsonValue,
            projectId: dto.projectId,
          },
        });

        const domain = await tx.domain.create({
          data: {
            serviceId: created.id,
            host: this.generateDomainHost(
              created.slug ?? created.id,
              created.id,
            ),
            status: 'VERIFIED',
          },
        });

        return { service: created, domain };
      });

      return service;
    } catch (error) {
      this.rethrowUnique(error, dto.name);
      throw error;
    }
  }

  findAll(ownerId: string, query: ListServiceQueryDto): Promise<Service[]> {
    return this.db.service.findMany({
      where: {
        project: { ownerId },
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, ownerId: string): Promise<Service> {
    const service = await this.db.service.findFirst({
      where: { id, project: { ownerId } },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async update(
    id: string,
    dto: UpdateServiceDto,
    ownerId: string,
  ): Promise<Service> {
    const existing = await this.findOne(id, ownerId);

    const source = dto.source ?? existing.source;
    this.assertSourceConfig(source, {
      repositoryUrl: dto.repositoryUrl ?? existing.repositoryUrl,
      archiveKey: dto.archiveKey ?? existing.archiveKey,
      imageRef: dto.imageRef ?? existing.imageRef,
    });

    try {
      return await this.db.service.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.name ? { slug: generateSlug(dto.name, 'Service name') } : {}),
          advancedConfig: dto.advancedConfig as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      this.rethrowUnique(error, dto.name ?? existing.name);
      throw error;
    }
  }

  async remove(id: string, ownerId: string): Promise<Service> {
    await this.findOne(id, ownerId);
    try {
      return await this.db.service.delete({ where: { id } });
    } catch (error) {
      // Deployment.service has no onDelete action -> restrict. Spec: block deletion
      // while history exists rather than cascade a running deployment.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Service has deployments and cannot be deleted',
        );
      }
      throw error;
    }
  }

  private async assertProjectOwned(
    projectId: string,
    ownerId: string,
  ): Promise<void> {
    const project = await this.db.project.findUnique({
      where: { id: projectId, ownerId },
    });
    // 404 not 403: do not leak that another user's project exists
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private assertSourceConfig(source: ServiceSource, cfg: SourceConfig): void {
    if (source === ServiceSource.GIT && !cfg.repositoryUrl) {
      throw new BadRequestException(
        'repositoryUrl is required when source is GIT',
      );
    }
    if (source === ServiceSource.UPLOAD && !cfg.archiveKey) {
      throw new BadRequestException(
        'archiveKey is required when source is UPLOAD',
      );
    }
    if (source === ServiceSource.IMAGE && !cfg.imageRef) {
      throw new BadRequestException(
        'imageRef is required when source is IMAGE',
      );
    }
  }

  private rethrowUnique(error: unknown, name: string): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        `A service named "${name}" already exists in this project`,
      );
    }
  }
  private generateDomainHost(slug: string, serviceId: string): string {
    const suffix = this.config.get<string>(
      'APP_DOMAIN_SUFFIX',
      '127.0.0.1.nip.io',
    );
    return `${slug}-${serviceId.slice(-6)}.${suffix}`.toLowerCase();
  }
}
