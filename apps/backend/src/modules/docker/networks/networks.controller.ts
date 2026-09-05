import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ROUTES } from '@app/core/constants';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/shared/auth';
import { NetworksService } from './networks.service';
import { CreateNetworkDto } from './dto/create-network.dto';

@Controller(ROUTES.DOCKER_NETWORKS.CONTROLLER)
@ApiTags(ROUTES.DOCKER_NETWORKS.TAGNAME)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NetworksController {
  constructor(private readonly networksService: NetworksService) { }

  @Get(ROUTES.DOCKER_NETWORKS.LIST)
  async listNetworks() {
    return this.networksService.listNetworks();
  }

  @Post(ROUTES.DOCKER_NETWORKS.CREATE)
  async createNetwork(@Body() body: CreateNetworkDto) {
    return this.networksService.createNetwork(body);
  }

  @Get(ROUTES.DOCKER_NETWORKS.DETAIL)
  async getNetworkById(@Param('id') id: string) {
    return this.networksService.getNetworkById(id);
  }

  @Delete(ROUTES.DOCKER_NETWORKS.REMOVE)
  async deleteNetwork(@Param('id') id: string) {
    return this.networksService.deleteNetwork(id);
  }
}
