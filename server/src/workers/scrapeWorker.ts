import 'dotenv/config';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { RedisService } from '../services/redis.service';
import { ProgressUpdate } from './types';
import { config } from '../config';
import { logger } from '../logger';

const CONCURRENCY = config.scrape.concurrency;

async function fetchWithAxios(url: string): Promise<string> {
  const res = await axios.get<string>(url, {
    responseType: 'text',
    maxRedirects: 5,
    timeout: 30_000,
  });
  return res.data;
}

async function fetchWithPuppeteer(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60_000 });
    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
}

async function scrapeUrl(url: string): Promise<string> {
  try {
    return await fetchWithAxios(url);
  } catch (e) {
    return await fetchWithPuppeteer(url);
  }
}

// Process a single URL directly (useful for CLI/testing)
async function runDirect(url: string): Promise<void> {
  const redis = new RedisService();
  try {
    // Claim this URL to prevent duplicate work across workers
    const claimed = await redis.markScrapeInProgress(url);
    if (!claimed) {
      logger.info('scrape already in progress elsewhere', { url });
      return;
    }

    const html = await scrapeUrl(url);
    await redis.pushAiTask(url, html);
    await redis.publishProgress({
      url,
      stage: 'scraped',
      timestamp: Date.now(),
    });
    logger.info('scrape succeeded', { url });
  } finally {
    await redis.clearScrapeInProgress(url);
    await redis.close();
  }
}

async function runQueue(): Promise<void> {
  const redis = new RedisService();

  // Long-running worker loop. Multiple instances can run concurrently.
  const worker = async () => {
    for (;;) {
      try {
        const url = await redis.blockPopUrl(5);
        if (!url) continue;

        try {
          const claimed = await redis.markScrapeInProgress(url);
          if (!claimed) {
            logger.info('queue skip (claimed elsewhere)', { url });
            continue;
          }

          const html = await scrapeUrl(url);
          await redis.pushAiTask(url, html);
          await redis.publishProgress({
            url,
            stage: 'scraped',
            timestamp: Date.now(),
          });
          logger.info('scrape succeeded', { url });
        } catch (err) {
          logger.error('scrape failed', { url, error: (err as Error).message });
        } finally {
          await redis.clearScrapeInProgress(url);
        }
      } catch (e) {
        logger.error('scrape worker error', e);
        await sleep(1000);
      }
    }
  };

  // Start multiple workers based on concurrency
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const url = process.argv[2];
  if (url) {
    await runDirect(url);
  } else {
    await runQueue();
  }
}

main().catch(err => {
  logger.error('scrapeWorker fatal error', err);
  process.exitCode = 1;
});
