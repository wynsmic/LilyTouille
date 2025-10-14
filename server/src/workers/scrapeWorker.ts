import 'dotenv/config';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { RedisQueue } from './queue';
import { QueueMessage, ScrapeTaskPayload } from './types';

const OUTPUT_DIR = path.resolve(__dirname, '..', 'data', 'scrapes');
const QUEUE_NAME = process.env.SCRAPE_QUEUE_NAME || 'scrape';

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

function buildSafeFilename(url: string): string {
  try {
    const u = new URL(url);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pathPart =
      u.pathname.replace(/\/+$/, '').replace(/\//g, '_') || 'root';
    const queryHash = u.search ? hashString(u.search) : 'noquery';
    return `${u.hostname}${pathPart ? '_' + pathPart : ''}_${queryHash}_${timestamp}`
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 200);
  } catch {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `scrape_${timestamp}`;
  }
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

async function saveHtml(url: string, html: string): Promise<string> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const filename = `${buildSafeFilename(url)}.html`;
  const filePath = path.join(OUTPUT_DIR, filename);
  await writeFile(filePath, html, 'utf-8');
  return filePath;
}

async function handleScrape(url: string): Promise<string> {
  try {
    const html = await fetchWithAxios(url);
    return await saveHtml(url, html);
  } catch (e) {
    const html = await fetchWithPuppeteer(url);
    return await saveHtml(url, html);
  }
}

async function runDirect(url: string): Promise<void> {
  const filePath = await handleScrape(url);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ status: 'succeeded', filePath }, null, 2));
}

async function runQueue(): Promise<void> {
  const queue = new RedisQueue<ScrapeTaskPayload>(QUEUE_NAME);
  await queue.consume(
    async (msg: QueueMessage<ScrapeTaskPayload>) => {
      try {
        const filePath = await handleScrape(msg.payload.url);
        // eslint-disable-next-line no-console
        console.log(
          JSON.stringify({ id: msg.id, status: 'succeeded', filePath })
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          JSON.stringify({
            id: msg.id,
            status: 'failed',
            error: (err as Error).message,
          })
        );
        throw err;
      }
    },
    { concurrency: Number(process.env.SCRAPE_CONCURRENCY || 1) }
  );
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
