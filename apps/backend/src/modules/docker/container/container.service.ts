import { Injectable, Logger } from '@nestjs/common';
import Docker from 'dockerode';
import { DockerService } from '../docker.service';
import {
  ContainerActionDto,
  DockerContainerDto,
} from './dto/docker-container.dto';
import { ContainerDetailDto } from './dto/container-detail.dto';
import { ListContainerFilterParamsDto } from './dto/listcontainer-filter.dto';
import { toDto } from '@app/shared/util';
import type { ContainerKillSignal } from '@workspace/types';

@Injectable()
export class ContainerService {
  private readonly logger = new Logger(ContainerService.name);

  constructor(private readonly dockerService: DockerService) {}

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
      await this.dockerService.getContainer(containerId).start();

      return { id: containerId, status: 'started' };
    } catch (error) {
      this.logger.error(`Error starting container ${containerId}:`, error);
      throw error;
    }
  }

  async stopContainer(containerId: string): Promise<ContainerActionDto> {
    try {
      await this.dockerService.getContainer(containerId).stop({ t: 10 });

      return { id: containerId, status: 'stopped' };
    } catch (error) {
      this.logger.error(`Error stop container ${containerId}:`, error);
      throw error;
    }
  }

  async restartContainer(containerId: string): Promise<ContainerActionDto> {
    try {
      await this.dockerService.getContainer(containerId).restart();

      return { id: containerId, status: 'running' };
    } catch (error) {
      this.logger.error(`Error restarting container ${containerId}:`, error);
      throw error;
    }
  }

  async killContainer(
    containerId: string,
    signal: ContainerKillSignal = 'SIGTERM',
  ): Promise<ContainerActionDto> {
    try {
      await this.dockerService.getContainer(containerId).kill({ signal });

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
      await this.dockerService
        .getContainer(containerId)
        .remove({ force, v: removeVolumes });

      return { id: containerId, status: 'removed' };
    } catch (error) {
      this.logger.error(`Error removing container ${containerId}:`, error);
      throw error;
    }
  }

  private getLabel(lable: string) {
    return `shipyard.${lable}`;
  }
}
