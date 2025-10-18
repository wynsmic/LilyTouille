# Workers

This backend uses two background workers orchestrated via Redis queues. They can be auto-started by the API process or run independently.

- Auto-start behavior is controlled by `WORKERS_AUTOSTART` (default: true in non-production). The API calls `startWorkers()` when enabled (see `src/main.ts`).
- Redis connection is configured via `REDIS_URL`.

## scrapeWorker

Purpose:

- Consumes URLs from the "processing" queue and performs the HTML fetch/scrape. On success, it enqueues the result for AI parsing.

Key details:

- Source: `src/workers/scrapeWorker.ts`
- Input queue: `processingQueue`
- Output queue: `aiQueue` with payload `{ url, html }`
- Concurrency: controlled by `SCRAPE_CONCURRENCY` (see `config.scrape.concurrency`)
- Concurrency/coordination: uses Redis sets to avoid double-processing URLs across workers

Error handling:

- On scrape failure (network/site errors), the worker logs an error. It does not retry or re-queue.
- It ensures any "in-progress" claim is cleared in finally blocks to prevent deadlocks.

## aiWorker

Purpose:

- Consumes `{ url, html }` from the AI queue, calls the AI API to parse a structured recipe, validates the result, and stores it.

Key details:

- Source: `src/workers/aiWorker.ts`
- Input queue: `aiQueue`
- Publishes progress events: `ai_processed`, then `stored` via Redis pub/sub
- Concurrency: controlled by `AI_CONCURRENCY` (see `config.ai.concurrency`)

Error handling:

- All failures are logged with the URL and error message. The worker does not retry or re-queue failed tasks.
- Examples of permanent failures include missing API key (`AI_API_KEY`/`OPENAI_API_KEY`) and 401/403 responses.

## Running workers

- Auto-started with the API when `WORKERS_AUTOSTART=true` (default in non-production). See `src/workers/launcher.ts` for child-process management.
- You can also run workers directly (useful for local testing):

```bash
# scrape worker: processes URLs from the queue, or a single URL if provided
pnpm ts-node src/workers/scrapeWorker.ts
pnpm ts-node src/workers/scrapeWorker.ts https://example.com/recipe

# ai worker: processes queued AI tasks, or a single task if provided (url + html)
pnpm ts-node src/workers/aiWorker.ts
pnpm ts-node src/workers/aiWorker.ts https://example.com/recipe "<html>..."
```

Environment variables:

- `REDIS_URL` – Redis connection string
- `AI_API_KEY` or `OPENAI_API_KEY` – required by `aiWorker` to call the AI API
- `SCRAPE_CONCURRENCY`, `AI_CONCURRENCY` – concurrency settings
- `WORKERS_AUTOSTART`, `WORKERS_SCRAPE_COUNT`, `WORKERS_AI_COUNT` – worker launch controls
