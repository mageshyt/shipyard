import { Injectable, Logger } from '@nestjs/common';
import { DockerService } from '../docker.service';
import { PROJECT_NAME } from '@app/core/constants';
import { toDto } from '@app/shared/util';
import { DockerVolumeDto } from './dto/volume-response.dto';
import { DeleteVolumeDto } from './dto/delete-volume.dto';

@Injectable()
export class VolumeService {
  private readonly logger = new Logger(VolumeService.name);
  constructor(private readonly dockerService: DockerService) {}

  async findAll(): Promise<DockerVolumeDto[]> {
    try {
      const volumes = await this.dockerService.client.listVolumes();
      return toDto(DockerVolumeDto, volumes.Volumes || []);
    } catch (error) {
      this.logger.error('Error listing volumes:', error);
      throw error;
    }
  }

  async create(name: string): Promise<DockerVolumeDto> {
    try {
      const volumeName = this.generateRandomName(name);

      await this.dockerService.client.createVolume({
        Name: volumeName,
        Labels: {
          'created-by': 'shipyard-api',
        },
      });

      // dockerode resolves createVolume to a Volume handle (not the response
      // body), so inspect it to return the actual volume details.
      const details = await this.dockerService.client
        .getVolume(volumeName)
        .inspect();

      return toDto(DockerVolumeDto, details);
    } catch (error) {
      this.logger.error('Error creating volume:', error);
      throw error;
    }
  }

  async remove(dto: DeleteVolumeDto): Promise<void> {
    const { name, force } = dto;

    try {
      const volume = this.dockerService.client.getVolume(name);
      await volume.remove({ force: force || false });
    } catch (error) {
      this.logger.error('Error removing volume:', error);
      throw error;
    }
  }

  async inspect(name: string): Promise<DockerVolumeDto> {
    try {
      const volume = this.dockerService.client.getVolume(name);
      const details = await volume.inspect();
      return toDto(DockerVolumeDto, details);
    } catch (error) {
      this.logger.error('Error inspecting volume:', error);
      throw error;
    }
  }

  private generateRandomName(name: string): string {
    const adjectives = ['quick', 'lazy', 'sleepy', 'noisy', 'hungry'];
    const nouns = ['fox', 'dog', 'cat', 'mouse', 'bear'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const prefix = PROJECT_NAME;
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${prefix}-${adjective}-${noun}-${name}`;
  }
}
