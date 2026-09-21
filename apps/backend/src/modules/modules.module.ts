import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { ServiceModule } from './service/service.module';
import { DockerModule } from './docker/docker.module';
import { ContainerModule } from './docker/container/container.module';
import { NetworksModule } from './docker/networks/networks.module';
import { ImagesModule } from './docker/images/images.module';
import { VolumeModule } from './docker/volume/volume.module';
import { DeploymentModule } from './deployment/deployment.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ProjectModule,
    ServiceModule,
    DockerModule,
    ContainerModule,
    NetworksModule,
    ImagesModule,
    VolumeModule,
    DeploymentModule,
  ],
})
export class Modules {}
