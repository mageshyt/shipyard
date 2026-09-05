import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Docker from 'dockerode';
import { DockerHealth } from './types/docker.types';

@Injectable()
export class DockerService implements OnModuleInit {
  private readonly logger = new Logger(DockerService.name);

  private docker!: Docker;
  onModuleInit() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
  }

  get client(): Docker {
    return this.docker;
  }

  getContainer(id: string) {
    return this.docker.getContainer(id);
  }

  async pingDocker(): Promise<DockerHealth> {
    try {
      const [, version, info] = await Promise.all([
        this.docker.ping(),
        this.docker.version(),
        this.docker.info(),
      ]);

      if (!version || !info) {
        throw new Error('Failed to retrieve Docker version or info');
      }

      return {
        reachable: true,
        serverVersion: version?.Version,
        apiVersion: version.ApiVersion,
        containers: {
          total: info.Containers,
          running: info.ContainersRunning,
          stopped: info.ContainersStopped,
        },
        images: info.Images,
      };
    } catch (error) {
      this.logger.error('Error pinging Docker:', error);
      throw error;
    }
  }

  async listImages(): Promise<Docker.ImageInfo[]> {
    try {
      const images = await this.docker.listImages();
      return images;
    } catch (error) {
      this.logger.error('Error listing images:', error);
      throw error;
    }
  }
}
