import 'dotenv/config';
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import IORedis, { Redis } from 'ioredis';
import { ProgressUpdate } from '../workers/types';
import { config } from '../config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public readonly redis: Redis;
  private readonly processingQueueKey = 'processingQueue';
  private readonly aiQueueKey = 'aiQueue';
  private readonly inventQueueKey = 'inventQueue';
  private readonly progressChannel = 'progressChannel';
  private readonly inprogressScrapeSet = 'inprogress:scrape';
  private readonly inprogressAiSet = 'inprogress:ai';
  private readonly inprogressInventSet = 'inprogress:invent';
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger(RedisService.name);
    const redisUrl = config.redis.url;

    // Log the Redis URL being used (mask password for security)
    const maskedUrl = redisUrl.replace(/:([^:@]+)@/, ':***@');
    this.logger.log(`Connecting to Redis: ${maskedUrl}`);

    // Railway requires IPv6 support - add family=0 to handle dual-stack lookup
    const redisUrlWithFamily = redisUrl.includes('?')
      ? `${redisUrl}&family=0`
      : `${redisUrl}?family=0`;

    this.redis = new IORedis(redisUrlWithFamily, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });

    // Add error handling for connection issues
    this.redis.on('error', error => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
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
    // Lightweight trace to confirm publish path
    try {
      const payload = JSON.stringify(update);
      await this.redis.publish(this.progressChannel, payload);
      this.logger.debug(
        `publishProgress channel=${this.progressChannel} url=${update.url} stage=${update.stage} ts=${update.timestamp}`
      );
    } catch (e) {
      this.logger.error('publishProgress error', e as any);
      throw e;
    }
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
          this.logger.debug(
            `subscribeToProgress <- message channel=${channel} url=${update.url} stage=${update.stage} ts=${update.timestamp}`
          );
          callback(update);
        } catch (error) {
          this.logger.error('Failed to parse progress update:', error as any);
        }
      }
    });

    // Store the subscriber reference to prevent it from being garbage collected
    // and to allow proper cleanup
    (this as any).progressSubscriber = subscriber;
  }

  // Invent Queue operations (recipe invention requests)
  async pushInventTask(task: any): Promise<void> {
    const taskJson = JSON.stringify(task);
    await this.redis.lpush(this.inventQueueKey, taskJson);
  }

  async popInventTask(): Promise<any | null> {
    const result = await this.redis.rpop(this.inventQueueKey);
    if (!result) return null;

    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  async blockPopInventTask(timeoutSeconds = 5): Promise<any | null> {
    const result = await this.redis.brpop(this.inventQueueKey, timeoutSeconds);
    if (!result) return null;

    try {
      return JSON.parse(result[1]);
    } catch {
      return null;
    }
  }

  // Utility methods
  async getQueueLength(
    queueName: 'processing' | 'ai' | 'invent'
  ): Promise<number> {
    const keyMap = {
      processing: this.processingQueueKey,
      ai: this.aiQueueKey,
      invent: this.inventQueueKey,
    };
    return await this.redis.llen(keyMap[queueName]);
  }

  async clearQueues(): Promise<void> {
    await this.redis.del(
      this.processingQueueKey,
      this.aiQueueKey,
      this.inventQueueKey
    );
  }

  // Concurrency helpers
  async markScrapeInProgress(url: string): Promise<boolean> {
    return (await this.redis.sadd(this.inprogressScrapeSet, url)) === 1;
  }

  async clearScrapeInProgress(url: string): Promise<void> {
    await this.redis.srem(this.inprogressScrapeSet, url);
  }

  async markAiInProgress(url: string): Promise<boolean> {
    return (await this.redis.sadd(this.inprogressAiSet, url)) === 1;
  }

  async clearAiInProgress(url: string): Promise<void> {
    await this.redis.srem(this.inprogressAiSet, url);
  }

  async markInventInProgress(taskId: string): Promise<boolean> {
    return (await this.redis.sadd(this.inprogressInventSet, taskId)) === 1;
  }

  async clearInventInProgress(taskId: string): Promise<void> {
    await this.redis.srem(this.inprogressInventSet, taskId);
  }

  async close(): Promise<void> {
    // Close the progress subscriber if it exists
    if ((this as any).progressSubscriber) {
      await (this as any).progressSubscriber.quit();
    }
    await this.redis.quit();
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }
}
