import 'dotenv/config';
import IORedis, { Redis } from 'ioredis';
import { randomUUID } from 'crypto';
import { QueueMessage } from './types';

export class RedisQueue<T = unknown> {
  private readonly redis: Redis;
  private readonly queueKey: string;
  private readonly processingKey: string;

  constructor(
    queueName: string,
    redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  ) {
    this.redis = new IORedis(redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: null,
    });
    this.queueKey = `queue:${queueName}`;
    this.processingKey = `queue:${queueName}:processing`;
  }

  async enqueue(payload: T): Promise<QueueMessage<T>> {
    const msg: QueueMessage<T> = {
      id: randomUUID(),
      type: 'task',
      payload,
      createdAt: Date.now(),
      attempts: 0,
    };
    await this.redis.lpush(this.queueKey, JSON.stringify(msg));
    return msg;
  }

  async consume(
    handler: (msg: QueueMessage<T>) => Promise<void>,
    options?: {
      concurrency?: number;
      visibilityTimeoutMs?: number;
      backoffMs?: number;
    }
  ): Promise<void> {
    const concurrency = Math.max(1, options?.concurrency ?? 1);
    const visibilityTimeoutMs = Math.max(
      1000,
      options?.visibilityTimeoutMs ?? 60_000
    );
    const backoffMs = Math.max(100, options?.backoffMs ?? 500);

    const worker = async () => {
      for (;;) {
        try {
          const res = await this.redis.brpoplpush(
            this.queueKey,
            this.processingKey,
            5
          );
          if (!res) {
            continue;
          }
          let msg: QueueMessage<T> | null = null;
          try {
            msg = JSON.parse(res) as QueueMessage<T>;
          } catch (e) {
            await this.redis.lrem(this.processingKey, 1, res);
            continue;
          }

          const timer = setTimeout(async () => {
            if (res) {
              await this.redis.lrem(this.processingKey, 1, res);
              await this.redis.rpush(this.queueKey, res);
            }
          }, visibilityTimeoutMs);

          try {
            await handler(msg);
            clearTimeout(timer);
            await this.redis.lrem(this.processingKey, 1, res);
          } catch (err) {
            clearTimeout(timer);
            msg.attempts += 1;
            const updated = JSON.stringify(msg);
            await this.redis.lrem(this.processingKey, 1, res);
            await this.redis.rpush(this.queueKey, updated);
            await sleep(backoffMs);
          }
        } catch (e) {
          await sleep(backoffMs);
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
