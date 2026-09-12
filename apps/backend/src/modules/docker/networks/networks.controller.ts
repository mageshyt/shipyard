import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ROUTES } from '@app/core/constants';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/shared/auth';
import { NetworksService } from './networks.service';
import { CreateNetworkDto } from './dto/create-network.dto';
import { NetworkResponseDto } from './dto/network-response.dto';

@Controller(ROUTES.DOCKER_NETWORKS.CONTROLLER)
@ApiTags(ROUTES.DOCKER_NETWORKS.TAGNAME)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NetworksController {
  constructor(private readonly networksService: NetworksService) {}

  @Get(ROUTES.DOCKER_NETWORKS.LIST)
  @ApiOperation({ summary: 'List all Docker networks' })
  @ApiOkResponse({ type: [NetworkResponseDto] })
  async listNetworks() {
    return this.networksService.listNetworks();
  }

  @Post(ROUTES.DOCKER_NETWORKS.CREATE)
  @ApiOperation({ summary: 'Create a Docker network' })
  @ApiOkResponse({ type: NetworkResponseDto })
  async createNetwork(@Body() body: CreateNetworkDto) {
    return this.networksService.createNetwork(body);
  }

  @Get(ROUTES.DOCKER_NETWORKS.DETAIL)
  @ApiOperation({ summary: 'Get a network by ID' })
  @ApiParam({ name: 'id', description: 'Network ID' })
  @ApiOkResponse({ type: NetworkResponseDto })
  async getNetworkById(@Param('id') id: string) {
    return this.networksService.getNetworkById(id);
  }

  @Delete(ROUTES.DOCKER_NETWORKS.REMOVE)
  @ApiOperation({ summary: 'Delete a network by ID' })
  @ApiParam({ name: 'id', description: 'Network ID' })
  async deleteNetwork(@Param('id') id: string) {
    return this.networksService.deleteNetwork(id);
  }
}
