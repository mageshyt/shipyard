import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class LoggerModule {
  static forRoot(): DynamicModule {
    return { module: LoggerModule, global: true };
  }
}

export class Logger {}
export function LoggerErrorInterceptor() {}
