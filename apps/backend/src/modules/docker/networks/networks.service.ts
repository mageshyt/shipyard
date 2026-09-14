import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { DockerService } from '../docker.service';
import { CreateNetworkDto } from './dto/create-network.dto';
import { NetworkResponseDto } from './dto/network-response.dto';
import { NetworkConnectionResponseDto } from './dto/network-connection.dto';
import { toDto } from '@app/shared/util';

@Injectable()
export class NetworksService {
  private readonly logger = new Logger(NetworksService.name);
  constructor(private readonly dockerService: DockerService) {}

  async listNetworks(): Promise<NetworkResponseDto[]> {
    try {
      const networks = await this.dockerService.client.listNetworks();
      return toDto(NetworkResponseDto, networks);
    } catch (error) {
      this.logger.error('Error listing networks:', error);
      throw error;
    }
  }

  async createNetwork(dto: CreateNetworkDto): Promise<NetworkResponseDto> {
    try {
      const network = await this.dockerService.client.createNetwork({
        Name: this.generateRandomName(8, dto.name),
        Driver: 'bridge',
      });

      return toDto(NetworkResponseDto, await network.inspect());
    } catch (error) {
      this.logger.error('Error creating network:', error);
      throw error;
    }
  }

  async getNetworkById(networkId: string): Promise<NetworkResponseDto> {
    try {
      const network = await this.dockerService.client
        .getNetwork(networkId)
        .inspect();

      return toDto(NetworkResponseDto, network);
    } catch (error) {
      this.logger.error('Error getting network by ID:', error);
      throw error;
    }
  }

  async deleteNetwork(networkId: string): Promise<void> {
    try {
      const network = this.dockerService.client.getNetwork(networkId);
      await network.remove();
    } catch (error) {
      this.logger.error('Error deleting network:', error);
      throw error;
    }
  }

  async toggleNetworkToContainer(
    containerId: string,
    networkId: string,
    action: 'connect' | 'disconnect',
  ): Promise<NetworkConnectionResponseDto> {
    try {
      const network = this.dockerService.client.getNetwork(networkId);

      if (action === 'connect') {
        await network.connect({ Container: containerId });
      } else {
        await network.disconnect({ Container: containerId });
      }

      return {
        networkId,
        containerId,
        status: action === 'connect' ? 'connected' : 'disconnected',
      };
    } catch (error) {
      this.logger.error(`Error ${action}ing container on network:`, error);
      throw error;
    }
  }
  private generateRandomName(length: number, network: string): string {
    const randomChars = crypto.randomBytes(length).toString('hex');

    const generatedName = `shipyard-${network}-${randomChars}`;

    this.logger.log(`Generated random network name: ${generatedName}`);

    return generatedName;
  }
}
