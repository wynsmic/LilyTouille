import { config } from './config';

type Level = 'error' | 'warn' | 'info' | 'debug';

const levelOrder: Record<Level, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function shouldLog(level: Level): boolean {
  return levelOrder[level] <= levelOrder[config.app.logLevel];
}

function format(level: Level, message: string, meta?: unknown): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${config.app.env}] ${level.toUpperCase()} ${message}`;
  if (meta === undefined) return base;
  try {
    return `${base} ${typeof meta === 'string' ? meta : JSON.stringify(meta)}`;
  } catch {
    return base;
  }
}

export const logger = {
  error(message: string, meta?: unknown): void {
    if (shouldLog('error')) console.error(format('error', message, meta));
  },
  warn(message: string, meta?: unknown): void {
    if (shouldLog('warn')) console.warn(format('warn', message, meta));
  },
  info(message: string, meta?: unknown): void {
    if (shouldLog('info')) console.log(format('info', message, meta));
  },
  debug(message: string, meta?: unknown): void {
    if (shouldLog('debug')) console.debug(format('debug', message, meta));
  },
};
