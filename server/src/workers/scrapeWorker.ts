import 'dotenv/config';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { RedisService } from '../services/redis.service';
import { ProgressUpdate } from './types';

const CONCURRENCY = Number(process.env.SCRAPE_CONCURRENCY || 1);

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

async function runDirect(url: string): Promise<void> {
  const redis = new RedisService();
  try {
    const html = await scrapeUrl(url);
    await redis.pushAiTask(url, html);
    await redis.publishProgress({
      url,
      stage: 'scraped',
      timestamp: Date.now(),
    });
    console.log(JSON.stringify({ status: 'succeeded', url }, null, 2));
  } finally {
    await redis.close();
  }
}

async function runQueue(): Promise<void> {
  const redis = new RedisService();

  const worker = async () => {
    for (;;) {
      try {
        const url = await redis.blockPopUrl(5);
        if (!url) continue;

        try {
          const html = await scrapeUrl(url);
          await redis.pushAiTask(url, html);
          await redis.publishProgress({
            url,
            stage: 'scraped',
            timestamp: Date.now(),
          });
          console.log(JSON.stringify({ status: 'succeeded', url }, null, 2));
        } catch (err) {
          console.error(
            JSON.stringify({
              url,
              status: 'failed',
              error: (err as Error).message,
            })
          );
          // Re-queue the URL for retry
          await redis.pushUrl(url);
        }
      } catch (e) {
        console.error('Worker error:', e);
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
  // eslint-disable-next-line no-console
  console.error('scrapeWorker fatal error:', err);
  process.exitCode = 1;
});
