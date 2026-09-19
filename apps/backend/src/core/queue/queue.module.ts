import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  DEPLOYMENTS_QUEUE,
  DEPLOYMENT_JOB_DEFAULTS,
  QUEUE_READY_TIMEOUT_MS,
} from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          username: config.get<string>('REDIS_USERNAME', 'default'),
          password: config.get<string>('REDIS_PASSWORD'),
          // required by BullMQ
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
      }),
    }),
    BullModule.registerQueue({
      name: DEPLOYMENTS_QUEUE,
      defaultJobOptions: DEPLOYMENT_JOB_DEFAULTS,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule implements OnModuleInit {
  private readonly logger = new Logger(QueueModule.name);

  constructor(
    @InjectQueue(DEPLOYMENTS_QUEUE)
    private readonly deploymentsQueue: Queue,
  ) {}

  async onModuleInit() {
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        this.deploymentsQueue.waitUntilReady(),
        new Promise<never>(
          (_, reject) =>
            (timer = setTimeout(
              () =>
                reject(
                  new Error(
                    `Redis not ready within ${QUEUE_READY_TIMEOUT_MS}ms`,
                  ),
                ),
              QUEUE_READY_TIMEOUT_MS,
            )),
        ),
      ]);
      this.logger.log(`Queue '${DEPLOYMENTS_QUEUE}' connected to Redis`);
    } catch (error) {
      this.logger.error(
        'Redis unreachable — refusing to boot without the deployment queue',
        error instanceof Error ? error.stack : error,
      );
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
