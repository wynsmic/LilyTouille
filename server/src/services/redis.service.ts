import 'dotenv/config';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import IORedis, { Redis } from 'ioredis';
import { ProgressUpdate } from '../workers/types';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public readonly redis: Redis;
  private readonly processingQueueKey = 'processingQueue';
  private readonly aiQueueKey = 'aiQueue';
  private readonly progressChannel = 'progressChannel';

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    this.redis = new IORedis(redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: null,
    });
  }

  // Processing Queue operations (URLs)
  async pushUrl(url: string): Promise<void> {
    await this.redis.lpush(this.processingQueueKey, url);
  }

  async popUrl(): Promise<string | null> {
    return await this.redis.rpop(this.processingQueueKey);
  }

  async blockPopUrl(timeoutSeconds = 5): Promise<string | null> {
    const result = await this.redis.brpop(
      this.processingQueueKey,
      timeoutSeconds
    );
    return result ? result[1] : null;
  }

  // AI Queue operations ({url, html})
  async pushAiTask(url: string, html: string): Promise<void> {
    const task = JSON.stringify({ url, html });
    await this.redis.lpush(this.aiQueueKey, task);
  }

  async popAiTask(): Promise<{ url: string; html: string } | null> {
    const result = await this.redis.rpop(this.aiQueueKey);
    if (!result) return null;

    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  async blockPopAiTask(
    timeoutSeconds = 5
  ): Promise<{ url: string; html: string } | null> {
    const result = await this.redis.brpop(this.aiQueueKey, timeoutSeconds);
    if (!result) return null;

    try {
      return JSON.parse(result[1]);
    } catch {
      return null;
    }
  }

  // Progress updates pub/sub
  async publishProgress(update: ProgressUpdate): Promise<void> {
    await this.redis.publish(this.progressChannel, JSON.stringify(update));
  }

  async subscribeToProgress(
    callback: (update: ProgressUpdate) => void
  ): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe(this.progressChannel);

    subscriber.on('message', (channel, message) => {
      if (channel === this.progressChannel) {
        try {
          const update = JSON.parse(message) as ProgressUpdate;
          callback(update);
        } catch (error) {
          console.error('Failed to parse progress update:', error);
        }
      }
    });
  }

  // Utility methods
  async getQueueLength(queueName: 'processing' | 'ai'): Promise<number> {
    const key =
      queueName === 'processing' ? this.processingQueueKey : this.aiQueueKey;
    return await this.redis.llen(key);
  }

  async clearQueues(): Promise<void> {
    await this.redis.del(this.processingQueueKey, this.aiQueueKey);
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }
}
