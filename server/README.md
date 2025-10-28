# Backend (NestJS) – Overview & Runbook

## Workers

See `WORKERS.md` for worker architecture, operations, and error handling.

### What this service does

- Serves recipe APIs (NestJS, TypeScript)
- Scrapes pages → queues HTML → AI parses to structured recipe → stores JSON
- Streams live progress via WebSocket (Socket.IO)

### Architecture (clean)

- Controller → Service → Worker
  - `controllers/scraper.controller.ts`: enqueue URLs
  - `services/scraper.service.ts`: direct HTML fetch-to-disk
  - `workers/scrapeWorker.ts`: robust scrape (axios → puppeteer fallback)
  - `workers/aiWorker.ts`: call AI API, validate JSON, store
  - `services/redis.service.ts`: queues, pub/sub, concurrency helpers
  - `gateways/progress.gateway.ts`: emits `progress-update` and `queue-status`

### Processing flow

1. Client POSTs URL → `POST /api/scrape/queue`
2. `scrapeWorker` pulls URL, fetches HTML, publishes `scraped`, enqueues AI task
3. `aiWorker` pulls AI task, calls model, validates JSON, stores, publishes `ai_processed` then `stored`
4. `progress.gateway` broadcasts updates to all clients

### Concurrency & coordination

- Multiple worker processes supported (configurable counts)
- Concurrency coordination using Redis sets:
  - in-progress: prevents duplicate work across workers

### Configuration (dotenv)

Managed in `src/config.ts`.

Required/optional env:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info

REDIS_URL=redis://127.0.0.1:6379

AI_API_KEY=sk-...
AI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
AI_CONCURRENCY=1

SCRAPE_CONCURRENCY=1

# Worker management
WORKERS_AUTOSTART=true        # auto-start workers in dev by default
WORKERS_MIN_THREADS=2         # fail fast if not enough logical CPUs
WORKERS_SCRAPE_COUNT=1
WORKERS_AI_COUNT=1
```

### Run it

Install deps:

```bash
cd server
npm install
```

Development (autostarts workers):

```bash
npm run dev
# API: http://localhost:5000/api
# WS:  connects via Socket.IO; events: progress-update, queue-status
```

Production:

```bash
npm run build
npm start
# API will start on PORT (default 5000)
# Workers autostart only if WORKERS_AUTOSTART=true
```

Worker processes in production:

- If `WORKERS_AUTOSTART=true` (recommended only if you want the API to supervise workers), the API process will spawn workers via `startWorkers()` on boot.
- If `WORKERS_AUTOSTART=false` (common in production), start workers separately as their own processes using your process manager (pm2, systemd, Docker, k8s):

```bash
# After building, run workers as standalone Node processes
node dist/workers/scrapeWorker.js
node dist/workers/aiWorker.js

# To run multiple instances, start the command multiple times
# or configure your process manager to set the desired instance count.
```

Suggested process manager setup:

- Keep the API and each worker type as separate services.
- Scale using process count; per-process concurrency is controlled by env:
  - `AI_CONCURRENCY` and `SCRAPE_CONCURRENCY` (parallel tasks within a process)
  - Use your manager to run N instances per worker type (total parallelism = instances × concurrency).

Manual worker control (optional for development):

```bash
npx ts-node src/workers/scrapeWorker.ts
npx ts-node src/workers/aiWorker.ts
```

### Security & logging

- `helmet` + CORS configured from env
- `morgan` request logging; app logs via `src/logger.ts` (levels: error,warn,info,debug)

### Key endpoints

- `GET /api/health` – liveness
- `POST /api/scrape/queue` – enqueue URL
- `GET /api/scrape/queue/status` – queue lengths

### Notes

- Scraped HTML files under `src/data/scrapes` are git-ignored
- Storage is JSON-file based for now (`src/data/recipes.json`)
