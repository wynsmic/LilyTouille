import 'dotenv/config';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { RedisService } from '../services/redis.service';
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

async function runQueue(): Promise<void> {
  const redis = new RedisService();

  // Long-running worker loop. Multiple instances can run concurrently.
  const worker = async () => {
    for (;;) {
      try {
        const queued = await redis.blockPopUrl(5);
        if (!queued) continue;

        // Extract optional ownerUserId from queued payload
        let ownerUserId: number | undefined;
        let rest = queued;
        let url = queued;
        const ownerIdx = queued.indexOf('|owner:');
        if (ownerIdx !== -1) {
          url = queued.substring(0, ownerIdx);
          rest = queued.substring(ownerIdx + 1);
          const parts = rest.split('|');
          for (const p of parts) {
            if (p.startsWith('ownerUserId:')) {
              const n = parseInt(p.substring('ownerUserId:'.length));
              if (!Number.isNaN(n)) ownerUserId = n;
            }
          }
        }

        try {
          const claimed = await redis.markScrapeInProgress(url);
          if (!claimed) {
            logger.info('queue skip (claimed elsewhere)', { url });
            continue;
          }

          const html = await scrapeUrl(url);
          await redis.pushAiTask(url, html, ownerUserId);
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
  await runQueue();
}

main().catch(err => {
  logger.error('scrapeWorker fatal error', err);
  process.exitCode = 1;
});
