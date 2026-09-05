import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { DockerService } from '../docker.service';
import Docker from 'dockerode';
import { CreateNetworkDto } from './dto/create-network.dto';

@Injectable()
export class NetworksService {
  private readonly logger = new Logger(NetworksService.name);
  constructor(private readonly dockerService: DockerService) { }

  async listNetworks(): Promise<Docker.NetworkInspectInfo[] | undefined> {
    try {
      const networks = await this.dockerService.client.listNetworks();
      return networks;
    } catch (error) {
      this.logger.error('Error listing networks:', error);
      throw error;
    }
  }

  async createNetwork(
    dto: CreateNetworkDto,
  ): Promise<Docker.Network | undefined> {
    try {
      const network = await this.dockerService.client.createNetwork({
        Name: this.generateRandomName(8, dto.name),
        Driver: 'bridge',
      });

      return network;
    } catch (error) {
      this.logger.error('Error creating network:', error);
      throw error;
    }
  }

  async getNetworkById(
    networkId: string,
  ): Promise<Docker.NetworkInspectInfo | null> {
    try {
      const network = await this.dockerService.client
        .getNetwork(networkId)
        .inspect();

      return network;
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

  private generateRandomName(length: number, network: string): string {
    const randomChars = crypto.randomBytes(length).toString('hex');

    const generatedName = `shipyard-${network}-${randomChars}`;

    this.logger.log(`Generated random network name: ${generatedName}`);

    return generatedName;
  }
}
