import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, QueueEvents } from 'bullmq';

export const NOTIFICATION_QUEUE = 'notifications';
export const PAYROLL_QUEUE      = 'payroll';
export const INCENTIVE_QUEUE    = 'incentives';
export const PERIODIC_QUEUE     = 'periodic-service';

export const QUEUE_TOKEN = (name: string) => `BULLMQ_QUEUE_${name.toUpperCase()}`;

function createQueueProvider(name: string) {
  return {
    provide: QUEUE_TOKEN(name),
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const redisUrl = config.get<string>('app.redisUrl') ?? 'redis://localhost:6379';
      const url = new URL(redisUrl);
      return new Queue(name, {
        connection: { host: url.hostname, port: Number(url.port) || 6379, password: url.password || undefined },
        defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
      });
    },
  };
}

@Global()
@Module({
  providers: [
    createQueueProvider(NOTIFICATION_QUEUE),
    createQueueProvider(PAYROLL_QUEUE),
    createQueueProvider(INCENTIVE_QUEUE),
    createQueueProvider(PERIODIC_QUEUE),
  ],
  exports: [
    QUEUE_TOKEN(NOTIFICATION_QUEUE),
    QUEUE_TOKEN(PAYROLL_QUEUE),
    QUEUE_TOKEN(INCENTIVE_QUEUE),
    QUEUE_TOKEN(PERIODIC_QUEUE),
  ],
})
export class QueueModule {}
