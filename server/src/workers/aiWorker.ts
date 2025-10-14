import 'dotenv/config';
import { RedisService } from '../services/redis.service';
import { DatabaseService } from '../services/database.service';
import { AiTaskPayload, ProgressUpdate, RecipeType } from './types';

const CONCURRENCY = Number(process.env.AI_CONCURRENCY || 1);

function cleanHtml(html: string): string {
  // Remove script tags and their content
  let cleaned = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );

  // Remove style tags and their content
  cleaned = cleaned.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ''
  );

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove extra whitespace and normalize
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

async function callAiForRecipe(html: string, url: string): Promise<RecipeType> {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const endpoint =
    process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
  if (!apiKey) {
    throw new Error('Missing AI_API_KEY/OPENAI_API_KEY');
  }

  // Clean the HTML before sending to AI
  const cleanedHtml = cleanHtml(html);

  // Minimal schema-constrained call using JSON mode if supported
  const system =
    'You are a parser that extracts structured recipe JSON. Respond with strict JSON matching the schema.';
  const user = `Extract a recipe object with fields: id(number), title(string), description(string), ingredients(string[]), overview(string[]), recipeSteps({type:"text"|"image",content,imageUrl?}[]), prepTime(number), cookTime(number), servings(number), difficulty("easy"|"medium"|"hard"), tags(string[]), imageUrl(string), rating(number), author(string). Source URL: ${url}. HTML:\n${cleanedHtml}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as any;
  const content: string = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as AiClientResponse | RecipeType;
  const recipe = (parsed as any).recipe
    ? (parsed as AiClientResponse).recipe
    : (parsed as RecipeType);
  return recipe;
}

async function processRecipe(url: string, html: string): Promise<RecipeType> {
  const recipe = await callAiForRecipe(html, url);
  return recipe;
}

async function storeRecipe(recipe: RecipeType): Promise<void> {
  const db = new DatabaseService();
  await db.initialize();
  await db.saveRecipe(recipe);
}

async function runDirect(url: string, html: string): Promise<void> {
  const redis = new RedisService();
  try {
    const recipe = await processRecipe(url, html);
    await storeRecipe(recipe);
    await redis.publishProgress({
      url,
      stage: 'ai_processed',
      timestamp: Date.now(),
    });
    await redis.publishProgress({
      url,
      stage: 'stored',
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
        const task = await redis.blockPopAiTask(5);
        if (!task) continue;

        try {
          const recipe = await processRecipe(task.url, task.html);
          await storeRecipe(recipe);
          await redis.publishProgress({
            url: task.url,
            stage: 'ai_processed',
            timestamp: Date.now(),
          });
          await redis.publishProgress({
            url: task.url,
            stage: 'stored',
            timestamp: Date.now(),
          });
          console.log(
            JSON.stringify({ status: 'succeeded', url: task.url }, null, 2)
          );
        } catch (err) {
          console.error(
            JSON.stringify({
              url: task.url,
              status: 'failed',
              error: (err as Error).message,
            })
          );
          // Re-queue the task for retry
          await redis.pushAiTask(task.url, task.html);
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
  const [url, html] = [process.argv[2], process.argv[3]];
  if (url && html) {
    await runDirect(url, html);
  } else {
    await runQueue();
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('aiWorker fatal error:', err);
  process.exitCode = 1;
});
