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
  private readonly progressChannel = 'progressChannel';
  private readonly processedScrapeSet = 'processed:scrape';
  private readonly processedAiSet = 'processed:ai';
  private readonly inprogressScrapeSet = 'inprogress:scrape';
  private readonly inprogressAiSet = 'inprogress:ai';
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger(RedisService.name);
    const redisUrl = config.redis.url;
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

  // Idempotency helpers
  async hasProcessedScrape(url: string): Promise<boolean> {
    return (await this.redis.sismember(this.processedScrapeSet, url)) === 1;
  }

  async hasProcessedAi(url: string): Promise<boolean> {
    return (await this.redis.sismember(this.processedAiSet, url)) === 1;
  }

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

  async markScrapeProcessed(url: string): Promise<void> {
    await this.redis.sadd(this.processedScrapeSet, url);
  }

  async markAiProcessed(url: string): Promise<void> {
    await this.redis.sadd(this.processedAiSet, url);
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }
}
