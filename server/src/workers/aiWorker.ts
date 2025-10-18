import 'dotenv/config';
import { RedisService } from '../services/redis.service';
import { DatabaseService } from '../services/database.service';
import { RecipeType } from './types';
import { config } from '../config';
import { logger } from '../logger';

const CONCURRENCY = config.ai.concurrency;

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

async function callAiForRecipe(
  html: string,
  url: string
): Promise<{ recipe: RecipeType; aiQuery: string; aiResponse: string }> {
  const apiKey = config.ai.apiKey;
  const endpoint = config.ai.endpoint;
  if (!apiKey) {
    throw new Error('Missing AI_API_KEY/OPENAI_API_KEY');
  }

  // Clean the HTML before sending to AI
  const cleanedHtml = cleanHtml(html);

  // Minimal schema-constrained call using JSON mode if supported
  const system =
    'You are a parser that extracts structured recipe JSON. Respond with strict JSON matching the schema.';
  const user = `Extract a recipe object with fields: id(number), title(string), description(string), ingredients(string[]), overview(string[]), recipeSteps({type:"text"|"image",content,imageUrl?}[]), prepTime(number), cookTime(number), servings(number), difficulty("easy"|"medium"|"hard"), tags(string[]), imageUrl(string), rating(number), author(string). Source URL: ${url}. HTML:\n${cleanedHtml}`;

  const requestBody = {
    model: config.ai.model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as any;
  const content: string = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as any;

  // Handle both wrapped and direct recipe responses
  const recipeCandidate = parsed.recipe ? parsed.recipe : parsed;

  // Validate minimal required shape to be retry-safe and prevent corrupt writes
  validateRecipeJson(recipeCandidate);

  return {
    recipe: recipeCandidate as RecipeType,
    aiQuery: JSON.stringify(requestBody, null, 2),
    aiResponse: JSON.stringify(data, null, 2),
  };
}

async function processRecipe(
  url: string,
  html: string
): Promise<{ recipe: RecipeType; aiQuery: string; aiResponse: string }> {
  const result = await callAiForRecipe(html, url);
  return result;
}

// Minimal runtime validation for AI JSON output
function validateRecipeJson(candidate: any): void {
  const errors: string[] = [];
  if (typeof candidate !== 'object' || candidate === null) {
    throw new Error('AI response is not an object');
  }
  if (typeof candidate.title !== 'string' || candidate.title.length === 0) {
    errors.push('title must be non-empty string');
  }
  if (!Array.isArray(candidate.ingredients)) {
    errors.push('ingredients must be an array of strings');
  }
  if (!Array.isArray(candidate.recipeSteps)) {
    errors.push('recipeSteps must be an array');
  }
  if (typeof candidate.servings !== 'number') {
    errors.push('servings must be a number');
  }
  if (typeof candidate.difficulty !== 'string') {
    errors.push('difficulty must be a string');
  }
  if (errors.length > 0) {
    throw new Error(`AI JSON validation failed: ${errors.join(', ')}`);
  }
}

async function storeRecipe(
  recipe: RecipeType,
  url: string,
  html: string,
  aiQuery: string,
  aiResponse: string
): Promise<void> {
  const db = new DatabaseService();
  await db.initialize();

  // Add the scraping metadata to the recipe
  const recipeWithMetadata = {
    ...recipe,
    sourceUrl: url,
    scrapedHtml: html,
    aiQuery: aiQuery,
    aiResponse: aiResponse,
    scrapedAt: new Date().toISOString(),
  };

  await db.saveRecipe(recipeWithMetadata);
}

async function runDirect(url: string, html: string): Promise<void> {
  const redis = new RedisService();
  try {
    const result = await processRecipe(url, html);
    await storeRecipe(
      result.recipe,
      url,
      html,
      result.aiQuery,
      result.aiResponse
    );
    await redis.publishProgress({
      url,
      stage: 'ai_processed',
      timestamp: Date.now(),
      recipeId: result.recipe.id,
    });
    await redis.publishProgress({
      url,
      stage: 'stored',
      timestamp: Date.now(),
      recipeId: result.recipe.id,
    });
    logger.info('ai processing + store succeeded', { url });
  } catch (err) {
    const message = (err as Error).message || String(err);
    await redis.publishProgress({
      url,
      stage: 'failed',
      timestamp: Date.now(),
      error: message,
    });
    logger.error('ai processing failed', { url, error: message });
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
          const result = await processRecipe(task.url, task.html);
          await storeRecipe(
            result.recipe,
            task.url,
            task.html,
            result.aiQuery,
            result.aiResponse
          );
          await redis.publishProgress({
            url: task.url,
            stage: 'ai_processed',
            timestamp: Date.now(),
            recipeId: result.recipe.id,
          });
          await redis.publishProgress({
            url: task.url,
            stage: 'stored',
            timestamp: Date.now(),
            recipeId: result.recipe.id,
          });
          logger.info('ai processing + store succeeded', { url: task.url });
        } catch (err) {
          const message = (err as Error).message || String(err);
          logger.error('ai processing failed', {
            url: task.url,
            error: message,
          });
          await redis.publishProgress({
            url: task.url,
            stage: 'failed',
            timestamp: Date.now(),
            error: message,
          });
          // No re-queue on any error (avoid infinite retry loops)
        }
      } catch (e) {
        logger.error('ai worker error', e);
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
  logger.error('aiWorker fatal error', err);
  process.exitCode = 1;
});
