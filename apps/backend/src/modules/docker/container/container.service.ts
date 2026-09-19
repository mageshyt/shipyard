import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import * as crypto from 'crypto';
import Docker from 'dockerode';
import { DockerService } from '../docker.service';
import {
  ContainerActionDto,
  DockerContainerDto,
} from './dto/docker-container.dto';
import { ContainerDetailDto } from './dto/container-detail.dto';
import { ListContainerFilterParamsDto } from './dto/listcontainer-filter.dto';
import { shipyardLabel, toDto } from '@app/shared/util';
import type { ContainerKillSignal } from '@workspace/types';
import { CreateContainerDto } from './dto/create-container.dto';
import { PrismaService } from '@app/shared/services/prisma/prisma.service';
import { LogLevel } from 'src/generated/prisma/client';
import { finalize, merge, Observable } from 'rxjs';
import { PassThrough, Readable } from 'stream';

@Injectable()
export class ContainerService {
  private readonly logger = new Logger(ContainerService.name);

  constructor(
    private readonly dockerService: DockerService,
    private readonly db: PrismaService,
  ) { }

  async listContainers(
    filters: ListContainerFilterParamsDto,
  ): Promise<DockerContainerDto[]> {
    const { all = false, serviceId, projectId } = filters;

    const filterOptions: Docker.ContainerListOptions = {
      all,
      filters: {},
    };

    if (serviceId) {
      filterOptions.filters!['label'] = [
        `${this.getLabel('serviceId')}=${serviceId}`,
      ];
    }

    if (projectId) {
      filterOptions.filters!['label'] = [
        ...(filterOptions.filters!['label'] || []),
        `${this.getLabel('projectId')}=${projectId}`,
      ];
    }

    this.logger.log(
      `Listing containers with filters: ${JSON.stringify(filterOptions)}`,
    );

    try {
      const containers =
        await this.dockerService.client.listContainers(filterOptions);

      return toDto(DockerContainerDto, containers);
    } catch (error) {
      this.logger.error('Error listing containers:', error);
      throw error;
    }
  }

  async findContainerById(
    containerId: string,
  ): Promise<ContainerDetailDto | null> {
    try {
      const containerInfo = await this.dockerService
        .getContainer(containerId)
        .inspect();

      return toDto(ContainerDetailDto, containerInfo);
    } catch (error) {
      this.logger.error(`Error finding container by ID ${containerId}:`, error);
      return null;
    }
  }

  async startContainer(containerId: string): Promise<ContainerActionDto> {
    try {
      await this.runContainerAction(containerId, 'started', () =>
        this.dockerService.getContainer(containerId).start(),
      );

      return { id: containerId, status: 'started' };
    } catch (error) {
      this.logger.error(`Error starting container ${containerId}:`, error);
      throw error;
    }
  }

  async stopContainer(
    containerId: string,
    t: number = 10,
  ): Promise<ContainerActionDto> {
    try {
      await this.runContainerAction(containerId, 'stopped', () =>
        this.dockerService.getContainer(containerId).stop({ t }),
      );

      return { id: containerId, status: 'stopped' };
    } catch (error) {
      this.logger.error(`Error stop container ${containerId}:`, error);
      throw error;
    }
  }

  async restartContainer(
    containerId: string,
    t: number = 10,
  ): Promise<ContainerActionDto> {
    try {
      await this.runContainerAction(containerId, 'restarted', () =>
        this.dockerService.getContainer(containerId).restart({ t }),
      );

      return { id: containerId, status: 'running' };
    } catch (error) {
      this.logger.error(`Error restarting container ${containerId}:`, error);
      throw error;
    }
  }

  async createContainer(dto: CreateContainerDto): Promise<ContainerDetailDto> {
    try {
      const service = dto.serviceId
        ? await this.db.service.findUnique({
          where: { id: dto.serviceId },
          select: { id: true, slug: true, projectId: true },
        })
        : null;

      const project = await this.resolveProject(
        dto.projectId ?? service?.projectId,
      );

      const name = dto.name ?? this.generateContainerName(service?.slug);
      const env = await this.buildEnv(dto.env, service?.id);

      // only auto-provision the derived project network; an explicit network
      // is assumed to be managed by the caller
      const network =
        dto.network ?? (project ? this.buildNetworkName(project) : undefined);

      if (!dto.network && network) {
        await this.ensureNetwork(network, project?.id);
      }

      const container = await this.dockerService.client.createContainer(
        this.toCreateOptions(dto, name, network, env),
      );

      const containerInfo = await container.inspect();

      await this.writeDeploymentLog(
        `Created container ${name} from image ${dto.image}`,
        { serviceId: service?.id, deploymentId: dto.deploymentId },
      );

      return toDto(ContainerDetailDto, containerInfo);
    } catch (error) {
      this.logger.error(`Error creating container:`, error);
      throw error;
    }
  }

  private resolveProject(projectId?: string) {
    return projectId
      ? this.db.project.findUnique({
        where: { id: projectId },
        select: { id: true, slug: true },
      })
      : Promise.resolve(null);
  }

  private buildNetworkName(project: {
    id: string;
    slug: string | null;
  }): string {
    // a project slug is only unique per owner, so append a stable id suffix
    // to keep the Docker network name globally unique and rename-proof
    return `shipyard-${project.slug ?? 'project'}-${project.id.slice(-6)}`;
  }

  private async ensureNetwork(name: string, projectId?: string): Promise<void> {
    const existing = await this.dockerService.client.listNetworks({
      filters: { name: [name] },
    });
    if (existing.some((network) => network.Name === name)) return;

    try {
      await this.dockerService.client.createNetwork({
        Name: name,
        Driver: 'bridge',
        Labels: projectId ? { [this.getLabel('projectId')]: projectId } : {},
      });
    } catch (error) {
      // concurrent create: a parallel request already provisioned it
      if ((error as { statusCode?: number }).statusCode === 409) return;
      throw error;
    }
  }

  private async buildEnv(
    envFromRequest?: string[],
    serviceId?: string,
  ): Promise<string[] | undefined> {
    const fromDb = serviceId
      ? await this.db.environmentVariable.findMany({
        where: { serviceId },
        select: { key: true, value: true },
      })
      : [];

    const merged = new Map<string, string>();
    for (const entry of [
      ...fromDb.map((variable) => `${variable.key}=${variable.value}`),
      ...(envFromRequest ?? []),
    ]) {
      const separator = entry.indexOf('=');
      if (separator === -1) {
        merged.set(entry, '');
      } else {
        merged.set(entry.slice(0, separator), entry.slice(separator + 1));
      }
    }

    return merged.size > 0
      ? [...merged].map(([key, value]) => `${key}=${value}`)
      : undefined;
  }

  private toCreateOptions(
    dto: CreateContainerDto,
    name: string,
    network?: string,
    env?: string[],
  ): Docker.ContainerCreateOptions {
    const labels: Record<string, string> = {};
    if (dto.projectId) labels[this.getLabel('projectId')] = dto.projectId;
    if (dto.serviceId) labels[this.getLabel('serviceId')] = dto.serviceId;
    if (dto.deploymentId)
      labels[this.getLabel('deploymentId')] = dto.deploymentId;

    const exposedPorts: Record<string, object> = {};
    const portBindings: Record<string, Array<{ HostPort: string }>> = {};

    for (const port of dto.ports ?? []) {
      const key = `${port.container}/${port.protocol ?? 'tcp'}`;
      exposedPorts[key] = {};
      portBindings[key] = [{ HostPort: String(port.host) }];
    }

    const binds = (dto.volumes ?? []).map(
      (volume) =>
        `${volume.name}:${volume.target}${volume.readOnly ? ':ro' : ''}`,
    );

    return {
      name,
      Image: dto.image,
      Env: env,
      Cmd: dto.cmd,
      Labels: labels,
      ExposedPorts:
        Object.keys(exposedPorts).length > 0 ? exposedPorts : undefined,
      HostConfig: {
        PortBindings:
          Object.keys(portBindings).length > 0 ? portBindings : undefined,
        Binds: binds.length > 0 ? binds : undefined,
        RestartPolicy: { Name: 'unless-stopped' },
        NetworkMode: network,
        Privileged: false,
      },
    };
  }

  private generateContainerName(slug?: string | null): string {
    const shortId = crypto.randomBytes(2).toString('hex');
    return `shipyard-${slug ?? 'container'}-${shortId}`;
  }

  private async writeDeploymentLog(
    message: string,
    refs: { serviceId?: string; deploymentId?: string },
  ): Promise<void> {
    try {
      await this.db.log.create({
        data: {
          message,
          level: LogLevel.INFO,
          serviceId: refs.serviceId,
          deploymentId: refs.deploymentId,
        },
      });
    } catch (error) {
      // logging must never fail the action that already succeeded
      this.logger.warn(`Failed to write deployment log: ${String(error)}`);
    }
  }

  private async runContainerAction<T>(
    containerId: string,
    verb: string,
    action: () => Promise<T>,
  ): Promise<T> {
    // read labels before the action; a removed container can't be inspected
    const refs = await this.readContainerRefs(containerId);

    const result = await action();

    await this.writeDeploymentLog(`Container ${containerId} ${verb}`, refs);

    return result;
  }

  private async readContainerRefs(
    containerId: string,
  ): Promise<{ serviceId?: string; deploymentId?: string }> {
    try {
      const info = await this.dockerService.getContainer(containerId).inspect();
      const labels = info.Config?.Labels ?? {};

      return {
        serviceId: labels[this.getLabel('serviceId')],
        deploymentId: labels[this.getLabel('deploymentId')],
      };
    } catch (error) {
      // labels are best-effort; logging must never fail the action
      this.logger.warn(
        `Failed to read labels for container ${containerId}: ${String(error)}`,
      );
      return {};
    }
  }

  async killContainer(
    containerId: string,
    signal: ContainerKillSignal = 'SIGTERM',
  ): Promise<ContainerActionDto> {
    try {
      await this.runContainerAction(containerId, 'killed', () =>
        this.dockerService.getContainer(containerId).kill({ signal }),
      );

      return { id: containerId, status: 'killed' };
    } catch (error) {
      this.logger.error(`Error killing container ${containerId}:`, error);
      throw error;
    }
  }

  async removeContainer(
    containerId: string,
    force: boolean = false,
    removeVolumes: boolean = false,
  ): Promise<ContainerActionDto> {
    try {
      await this.runContainerAction(containerId, 'removed', () =>
        this.dockerService
          .getContainer(containerId)
          .remove({ force, v: removeVolumes }),
      );

      return { id: containerId, status: 'removed' };
    } catch (error) {
      this.logger.error(`Error removing container ${containerId}:`, error);
      throw error;
    }
  }

  async streamContainerLogs(
    containerId: string,
    tail: number = 100,
  ): Promise<Observable<MessageEvent>> {
    const container = this.dockerService.getContainer(containerId);

    const logOptions: Docker.ContainerLogsOptions & { follow: true } = {
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
      follow: true,
    };

    const logStream = (await container.logs(logOptions)) as Readable;

    const { Config } = await container.inspect();
    const isTty = Config?.Tty ?? false;

    const stdout = new PassThrough();
    const stderr = new PassThrough();

    const sources: Array<{ stream: 'stdout' | 'stderr'; readable: Readable }> =
      isTty
        ? [{ stream: 'stdout', readable: logStream }]
        : [
          { stream: 'stdout', readable: stdout },
          { stream: 'stderr', readable: stderr },
        ];

    if (!isTty) {
      container.modem.demuxStream(logStream, stdout, stderr);
    }

    this.logger.log(`Streaming logs for container ${containerId}`);

    return merge(
      ...sources.map((source) => this.toLines(source.readable, source.stream)),
    ).pipe(
      finalize(() => {
        this.logger.log(`Stopped streaming logs for container ${containerId}`);
        logStream.destroy();
        stdout.destroy();
        stderr.destroy();
      }),
    );
  }

  private toLines(
    readable: Readable,
    stream: 'stdout' | 'stderr',
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let carry = '';

      const emit = (line: string) => {
        const trimmed = line.replace(/\r$/, '');
        if (trimmed.length > 0) {
          subscriber.next({ data: trimmed, type: stream });
        }
      };

      const onData = (chunk: Buffer) => {
        carry += chunk.toString('utf8');
        const lines = carry.split('\n');
        carry = lines.pop() ?? '';
        lines.forEach(emit);
      };

      const onEnd = () => {
        emit(carry);
        subscriber.complete();
      };

      const onError = (error: Error) => subscriber.error(error);

      readable.on('data', onData);
      readable.on('end', onEnd);
      readable.on('error', onError);

      return () => {
        readable.off('data', onData);
        readable.off('end', onEnd);
        readable.off('error', onError);
      };
    });
  }

  private getLabel(lable: string) {
    return shipyardLabel(lable);
  }
}
