import 'dotenv/config';
import path from 'path';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export const config = {
  app: {
    port: Number(process.env.PORT || 5000),
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : '*',
    apiVersion: process.env.API_VERSION || 'v1',
    logLevel: (process.env.LOG_LEVEL as LogLevel) || 'info',
  },
  auth0: {
    domain: process.env.AUTH0_DOMAIN || '',
    audience: process.env.AUTH0_AUDIENCE || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },
  ai: {
    apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '',
    endpoint:
      process.env.AI_API_ENDPOINT ||
      'https://api.openai.com/v1/chat/completions',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    concurrency: Number(process.env.AI_CONCURRENCY || 1),
  },
  scrape: {
    concurrency: Number(process.env.SCRAPE_CONCURRENCY || 1),
  },
  workers: {
    autoStart: process.env.WORKERS_AUTOSTART
      ? process.env.WORKERS_AUTOSTART === 'true'
      : (process.env.NODE_ENV || 'development') !== 'production',
    minThreads: Number(process.env.WORKERS_MIN_THREADS || 2),
    scrapeWorkers: Number(process.env.WORKERS_SCRAPE_COUNT || 1),
    aiWorkers: Number(process.env.WORKERS_AI_COUNT || 1),
  },
  db: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://localhost:5432/labonneboubouffe',
    type: 'postgres',
    synchronize: true, // Enable automatic table creation for both dev and prod
    logging: process.env.NODE_ENV === 'development',
    entities: [path.resolve(__dirname, 'entities', '*.entity.ts')],
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  },
} as const;

export function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
