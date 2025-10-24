import { cpus } from 'os';
import { fork } from 'child_process';
import path from 'path';
import { config } from '../config';
import { logger } from '../logger';

type WorkerSpec = {
  name: string;
  scriptTs: string;
  scriptJs: string;
  count: number;
};

function resolveScript(scriptTs: string, scriptJs: string): string {
  const isProd = config.app.env === 'production';
  return isProd
    ? path.resolve(__dirname, '..', '..', 'dist', scriptJs)
    : path.resolve(__dirname, '..', scriptTs);
}

export function startWorkers(): void {
  const available = cpus().length;
  const required = Math.max(
    config.workers.minThreads,
    config.workers.scrapeWorkers + config.workers.aiWorkers
  );
  if (available < required) {
    throw new Error(
      `Insufficient threads/CPUs. Required at least ${required}, found ${available}`
    );
  }

  const workers: WorkerSpec[] = [
    {
      name: 'scrapeWorker',
      scriptTs: 'workers/scrapeWorker.ts',
      scriptJs: 'workers/scrapeWorker.js',
      count: config.workers.scrapeWorkers,
    },
    {
      name: 'aiWorker',
      scriptTs: 'workers/aiWorker.ts',
      scriptJs: 'workers/aiWorker.js',
      count: config.workers.aiWorkers,
    },
    {
      name: 'inventWorker',
      scriptTs: 'workers/inventWorker.ts',
      scriptJs: 'workers/inventWorker.js',
      count: config.workers.aiWorkers, // Use same count as AI workers
    },
  ];

  for (const spec of workers) {
    const scriptPath = resolveScript(spec.scriptTs, spec.scriptJs);
    for (let i = 0; i < spec.count; i++) {
      const child = fork(scriptPath, [], {
        stdio: 'inherit',
        env: process.env,
      });
      logger.info(`Started ${spec.name} [pid=${child.pid}]`);
      child.on('exit', code => {
        logger.warn(`${spec.name} exited`, { code });
      });
      child.on('error', err => {
        logger.error(`${spec.name} error`, err);
      });
    }
  }
}
