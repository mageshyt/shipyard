import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ROUTES } from '@app/core/constants';
import { JwtAuthGuard } from '@app/shared/auth';
import { GetUser } from '@app/shared/decorators';
import { DeploymentService } from './deployment.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';

@ApiTags(ROUTES.SERVICE.TAGNAME)
@Controller(ROUTES.SERVICE.CONTROLLER)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) { }

  @Post(ROUTES.SERVICE.DEPLOYMENTS)
  create(
    @Param('id') serviceId: string,
    @Body() dto: CreateDeploymentDto,
    @GetUser('id') userId: string,
  ) {
    return this.deploymentService.createDeploymentJob(serviceId, userId, dto);
  }

  @Post(ROUTES.SERVICE.CANCEL_DEPLOYMENT)
  cancelDeployment(
    @Param('id') serviceId: string,
    @Param('deploymentId') deploymentId: string,
    @GetUser('id') userId: string,
  ) {
    return this.deploymentService.cancelDeploymentJob(
      serviceId,
      deploymentId,
      userId,
    );
  }

  @Post(ROUTES.SERVICE.RESTART_DEPLOYMENT)
  restartDeployment(
    @Param('id') serviceId: string,
    @Param('deploymentId') deploymentId: string,
    @GetUser('id') userId: string,
  ) {
    return this.deploymentService.restartDeploymentJob(
      serviceId,
      deploymentId,
      userId,
    );
  }
}
