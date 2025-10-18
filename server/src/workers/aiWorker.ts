import 'dotenv/config';
import { RedisService } from '../services/redis.service';
import { DatabaseService } from '../services/database.service';
import { RecipeType } from './types';
import { config } from '../config';
import { logger } from '../logger';

const CONCURRENCY = config.ai.concurrency;

export function cleanHtml(html: string): string {
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

  // Remove comment sections - these are costly to process with AI and not useful for recipes
  cleaned = removeCommentSections(cleaned);

  // Remove extra whitespace and normalize
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Limit payload size to ~128k tokens to avoid OpenAI limits and reduce costs
  cleaned = limitPayloadSize(cleaned, 128000);

  return cleaned;
}

export function limitPayloadSize(
  html: string,
  maxTokens: number = 128000
): string {
  const estimatedTokens = estimateTokenCount(html);

  if (estimatedTokens <= maxTokens) {
    return html;
  }

  // Calculate the character limit based on token limit
  const maxCharacters = Math.floor(maxTokens * 3.5);

  // If HTML is too long, truncate it but try to end at a reasonable point
  if (html.length > maxCharacters) {
    const truncated = html.substring(0, maxCharacters);

    // Try to find a good breaking point (end of a tag or sentence)
    const lastTagEnd = truncated.lastIndexOf('>');
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );

    // Use the better breaking point, but don't go too far back
    const breakPoint = Math.max(lastTagEnd, lastSentenceEnd);
    const safeBreakPoint = Math.max(breakPoint, maxCharacters * 0.9); // Don't go back more than 10%

    return html.substring(0, safeBreakPoint) + '...';
  }

  return html;
}

export function estimateTokenCount(text: string): number {
  // Conservative estimation: ~3.5 characters per token
  // This accounts for HTML markup, punctuation, and multilingual content
  // 128k tokens ≈ 448k characters (128,000 * 3.5)
  return Math.ceil(text.length / 3.5);
}

export function removeCommentSections(html: string): string {
  let cleaned = html;

  // Common comment section patterns in multiple languages
  const commentPatterns = [
    // French patterns
    /<section[^>]*class[^>]*comment[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*class[^>]*comment[^>]*>[\s\S]*?<\/div>/gi,
    /<section[^>]*id[^>]*comment[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*id[^>]*comment[^>]*>[\s\S]*?<\/div>/gi,

    // Commentaires (French)
    /<section[^>]*class[^>]*commentaire[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*class[^>]*commentaire[^>]*>[\s\S]*?<\/div>/gi,
    /<section[^>]*id[^>]*commentaire[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*id[^>]*commentaire[^>]*>[\s\S]*?<\/div>/gi,

    // Reviews patterns
    /<section[^>]*class[^>]*review[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*class[^>]*review[^>]*>[\s\S]*?<\/div>/gi,
    /<section[^>]*id[^>]*review[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*id[^>]*review[^>]*>[\s\S]*?<\/div>/gi,

    // Avis (French for reviews)
    /<section[^>]*class[^>]*avis[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*class[^>]*avis[^>]*>[\s\S]*?<\/div>/gi,
    /<section[^>]*id[^>]*avis[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*id[^>]*avis[^>]*>[\s\S]*?<\/div>/gi,

    // Feedback patterns
    /<section[^>]*class[^>]*feedback[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*class[^>]*feedback[^>]*>[\s\S]*?<\/div>/gi,
    /<section[^>]*id[^>]*feedback[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*id[^>]*feedback[^>]*>[\s\S]*?<\/div>/gi,

    // Discussion patterns
    /<section[^>]*class[^>]*discussion[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*class[^>]*discussion[^>]*>[\s\S]*?<\/div>/gi,
    /<section[^>]*id[^>]*discussion[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*id[^>]*discussion[^>]*>[\s\S]*?<\/div>/gi,

    // User comments patterns
    /<section[^>]*class[^>]*user-comment[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*class[^>]*user-comment[^>]*>[\s\S]*?<\/div>/gi,
    /<section[^>]*class[^>]*user_comment[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*class[^>]*user_comment[^>]*>[\s\S]*?<\/div>/gi,

    // Generic comment containers
    /<aside[^>]*class[^>]*comment[^>]*>[\s\S]*?<\/aside>/gi,
    /<aside[^>]*id[^>]*comment[^>]*>[\s\S]*?<\/aside>/gi,
    /<aside[^>]*class[^>]*commentaire[^>]*>[\s\S]*?<\/aside>/gi,
    /<aside[^>]*id[^>]*commentaire[^>]*>[\s\S]*?<\/aside>/gi,
    /<aside[^>]*class[^>]*avis[^>]*>[\s\S]*?<\/aside>/gi,
    /<aside[^>]*id[^>]*avis[^>]*>[\s\S]*?<\/aside>/gi,

    // Article comments (common in blog-style recipe sites)
    /<article[^>]*class[^>]*comment[^>]*>[\s\S]*?<\/article>/gi,
    /<article[^>]*id[^>]*comment[^>]*>[\s\S]*?<\/article>/gi,
    /<article[^>]*class[^>]*commentaire[^>]*>[\s\S]*?<\/article>/gi,
    /<article[^>]*id[^>]*commentaire[^>]*>[\s\S]*?<\/article>/gi,
  ];

  // Apply all comment section patterns
  commentPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Also remove comment-related headings and their following content
  const commentHeadingPatterns = [
    // French headings
    /<h[1-6][^>]*>[\s]*commentaires?[\s]*<\/h[1-6]>[\s\S]*?(?=<h[1-6]|<\/body>|$)/gi,
    /<h[1-6][^>]*>[\s]*avis[\s]*<\/h[1-6]>[\s\S]*?(?=<h[1-6]|<\/body>|$)/gi,

    // English headings
    /<h[1-6][^>]*>[\s]*comments?[\s]*<\/h[1-6]>[\s\S]*?(?=<h[1-6]|<\/body>|$)/gi,
    /<h[1-6][^>]*>[\s]*reviews?[\s]*<\/h[1-6]>[\s\S]*?(?=<h[1-6]|<\/body>|$)/gi,
    /<h[1-6][^>]*>[\s]*feedback[\s]*<\/h[1-6]>[\s\S]*?(?=<h[1-6]|<\/body>|$)/gi,
    /<h[1-6][^>]*>[\s]*discussion[\s]*<\/h[1-6]>[\s\S]*?(?=<h[1-6]|<\/body>|$)/gi,
  ];

  commentHeadingPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

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
  const userContent = `Extract a recipe object with fields: id(number), title(string), description(string), ingredients(string[]), overview(string[]), recipeSteps({type:"text"|"image",content,imageUrl?}[]), prepTime(number), cookTime(number), servings(number), difficulty("easy"|"medium"|"hard"), tags(string[]), imageUrl(string), rating(number), author(string), parts?({title(string), description?(string), ingredients(string[]), recipeSteps({type:"text"|"image",content,imageUrl?}[]), prepTime?(number), cookTime?(number)}[]), isChunked?(boolean). 

If the recipe is split into multiple parts (like "Part 1: Dough", "Part 2: Filling", etc.), set isChunked to true and populate the parts array with each part. Each part should have its own ingredients and recipeSteps. The main ingredients and recipeSteps should contain the overall recipe summary.

Source URL: ${url}. HTML:\n${cleanedHtml}`;

  // Limit the payload size to control costs (approximately 128k characters)
  const limitedUserContent = limitPayloadSize(userContent, 128000);

  const requestBody = {
    model: config.ai.model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: limitedUserContent },
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

  // Validate chunked recipe structure if present
  if (candidate.isChunked === true) {
    if (!Array.isArray(candidate.parts)) {
      errors.push('parts must be an array when isChunked is true');
    } else {
      candidate.parts.forEach((part: any, index: number) => {
        if (typeof part.title !== 'string' || part.title.length === 0) {
          errors.push(`parts[${index}].title must be non-empty string`);
        }
        if (!Array.isArray(part.ingredients)) {
          errors.push(
            `parts[${index}].ingredients must be an array of strings`
          );
        }
        if (!Array.isArray(part.recipeSteps)) {
          errors.push(`parts[${index}].recipeSteps must be an array`);
        }
      });
    }
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
