import 'dotenv/config';
import path from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { RedisQueue } from './queue';
import { AiTaskPayload, QueueMessage, RecipeType } from './types';

const OUTPUT_DIR = path.resolve(__dirname, '..', 'data', 'scrapes');
const QUEUE_NAME = process.env.AI_QUEUE_NAME || 'ai';

interface AiClientResponse {
  recipe: RecipeType;
}

async function callAiForRecipe(
  html: string,
  url?: string
): Promise<RecipeType> {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const endpoint =
    process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
  if (!apiKey) {
    throw new Error('Missing AI_API_KEY/OPENAI_API_KEY');
  }

  // Minimal schema-constrained call using JSON mode if supported
  const system =
    'You are a parser that extracts structured recipe JSON. Respond with strict JSON matching the schema.';
  const user = `Extract a recipe object with fields: id(number), title(string), description(string), ingredients(string[]), overview(string[]), recipeSteps({type:"text"|"image",content,imageUrl?}[]), prepTime(number), cookTime(number), servings(number), difficulty("easy"|"medium"|"hard"), tags(string[]), imageUrl(string), rating(number), author(string). Source URL: ${url ?? ''}. HTML:\n${html}`;

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

async function processHtml(htmlPath: string, url?: string): Promise<string> {
  const html = await readFile(htmlPath, 'utf-8');
  const recipe = await callAiForRecipe(html, url);
  const outName = path.basename(htmlPath).replace(/\.html?$/i, '.recipe.json');
  const outPath = path.join(OUTPUT_DIR, outName);
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(outPath, JSON.stringify(recipe, null, 2), 'utf-8');
  return outPath;
}

async function runDirect(htmlPath: string, url?: string): Promise<void> {
  const outPath = await processHtml(htmlPath, url);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ status: 'succeeded', outPath }, null, 2));
}

async function runQueue(): Promise<void> {
  const queue = new RedisQueue<AiTaskPayload>(QUEUE_NAME);
  await queue.consume(
    async (msg: QueueMessage<AiTaskPayload>) => {
      try {
        const outPath = await processHtml(
          msg.payload.htmlPath,
          msg.payload.url
        );
        // eslint-disable-next-line no-console
        console.log(
          JSON.stringify({ id: msg.id, status: 'succeeded', outPath })
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
    { concurrency: Number(process.env.AI_CONCURRENCY || 1) }
  );
}

async function main(): Promise<void> {
  const [htmlPath, url] = [process.argv[2], process.argv[3]];
  if (htmlPath) {
    await runDirect(htmlPath, url);
  } else {
    await runQueue();
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('aiWorker fatal error:', err);
  process.exitCode = 1;
});
