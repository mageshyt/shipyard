import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { DockerModule } from './docker/docker.module';
import { ContainerModule } from './docker/container/container.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ProjectModule,
    DockerModule,
    ContainerModule,
  ],
})
export class Modules { }
