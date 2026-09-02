import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Modules } from './modules/.module';

import * as appOptions from '@app/core/config/app.option';
import { loggerConfig } from '@app/core/config/logger.config';

import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { ServicesModule } from '@app/shared/services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot(appOptions.configModuleOptions),
    LoggerModule.forRoot(loggerConfig),
    ServicesModule,
    Modules,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
