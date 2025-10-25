import 'dotenv/config';
import { RedisService } from '../services/redis.service';
import { DatabaseService } from '../services/database.service';
import { RecipeType } from './types';
import { Recipe } from '../interfaces/recipe.interface';
import { config } from '../config';
import { logger } from '../logger';

const CONCURRENCY = config.ai.concurrency;

interface InventTask {
  id: string;
  title: string;
  description?: string;
  cuisine?: string;
  type?: string;
  difficulty?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  ingredients?: string[];
  dietaryRestrictions?: string[];
  cookingMethods?: string[];
  specialInstructions?: string;
  timestamp: number;
  userId?: string;
}

async function callAiForRecipeInvention(task: InventTask): Promise<{
  recipe: RecipeType;
  aiQuery: string;
  aiResponse: string;
}> {
  const apiKey = config.ai.apiKey;
  const endpoint = config.ai.endpoint;
  if (!apiKey) {
    throw new Error('Missing AI_API_KEY/OPENAI_API_KEY');
  }

  // Build a comprehensive prompt for recipe invention
  const system = `You are a creative chef and recipe developer. Create a complete, detailed recipe based on the user's specifications. The recipe should be practical, well-structured, and include all necessary details for successful cooking.`;

  const userContent = `Create a complete recipe with the following specifications:

Title: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
${task.cuisine ? `Cuisine: ${task.cuisine}` : ''}
${task.type ? `Type: ${task.type}` : ''}
${task.difficulty ? `Difficulty: ${task.difficulty}` : ''}
${task.servings ? `Servings: ${task.servings}` : ''}
${task.prepTime ? `Prep Time: ${task.prepTime} minutes` : ''}
${task.cookTime ? `Cook Time: ${task.cookTime} minutes` : ''}
${task.ingredients && task.ingredients.length > 0 ? `Preferred Ingredients: ${task.ingredients.join(', ')}` : ''}
${task.dietaryRestrictions && task.dietaryRestrictions.length > 0 ? `Dietary Restrictions: ${task.dietaryRestrictions.join(', ')}` : ''}
${task.cookingMethods && task.cookingMethods.length > 0 ? `Cooking Methods: ${task.cookingMethods.join(', ')}` : ''}
${task.specialInstructions ? `Special Instructions: ${task.specialInstructions}` : ''}

Create a complete recipe object in JSON format with fields: title(string), description(string), overview(string[]), totalPrepTime(number), totalCookTime(number), servings(number), difficulty("easy"|"medium"|"hard"), tags(string[]), imageUrl(string), rating(number), author(string), chunks({title(string), description?(string), ingredients(string[]), recipeSteps({type:"text"|"image",content,imageUrl?}[]), prepTime(number), cookTime(number), servings(number), difficulty("easy"|"medium"|"hard"), tags(string[]), imageUrl?(string), rating(number), orderIndex(number)}[]).

CRITICAL INSTRUCTIONS:
1. CREATE COMPLETE RECIPE: Generate a full, detailed recipe with all necessary components.
2. OVERVIEW SECTION: Provide a helpful overview (2-4 sentences) that describes the dish, its flavors, and key cooking techniques.
3. INGREDIENTS: List all ingredients with specific quantities and measurements.
4. RECIPE STEPS: Create detailed, step-by-step instructions that are clear and easy to follow.
5. CHUNKS STRUCTURE: ALL recipes must have a chunks array. For most invented recipes, create a single chunk with orderIndex 0. Only create multiple chunks if the recipe has distinct components (like a cake with frosting, pizza with dough and toppings, etc.).
6. TIMING: Provide realistic prep and cook times based on the recipe complexity.
7. DIFFICULTY: Assess the difficulty level based on techniques required.
8. TAGS: Include relevant tags for cuisine, type, dietary restrictions, cooking methods, etc.
9. RATING: Assign a realistic rating (4.0-5.0) based on the recipe's appeal and execution.
10. IMAGE: Use a placeholder image URL like "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800" for the main image.
11. AUTHOR: Set author as "AI Chef" for invented recipes.

CHUNK EXAMPLES:
- Simple recipe: chunks: [{"title": "Main Recipe", "ingredients": [...], "recipeSteps": [...], "prepTime": 30, "cookTime": 45, "servings": 4, "difficulty": "medium", "tags": [...], "rating": 4.5, "orderIndex": 0, ...}]
- Complex recipe: chunks: [{"title": "Dough", "ingredients": [...], "recipeSteps": [...], "prepTime": 20, "cookTime": 0, "servings": 4, "difficulty": "medium", "tags": [...], "rating": 4.5, "orderIndex": 0, ...}, {"title": "Filling", "ingredients": [...], "recipeSteps": [...], "prepTime": 10, "cookTime": 30, "servings": 4, "difficulty": "medium", "tags": [...], "rating": 4.5, "orderIndex": 1, ...}]

Make the recipe creative, delicious, and practical. Ensure all measurements are accurate and instructions are clear. Return the response as valid JSON.`;

  const requestBody = {
    model: config.ai.model,
    temperature: 0.7, // Higher temperature for creativity
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
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

  // Validate minimal required shape
  validateRecipeJson(recipeCandidate);

  return {
    recipe: recipeCandidate as RecipeType,
    aiQuery: JSON.stringify(requestBody, null, 2),
    aiResponse: JSON.stringify(data, null, 2),
  };
}

async function processRecipeInvention(task: InventTask): Promise<{
  recipe: RecipeType;
  aiQuery: string;
  aiResponse: string;
}> {
  const result = await callAiForRecipeInvention(task);
  return result;
}

// Enhanced runtime validation for AI JSON output
function validateRecipeJson(candidate: any): void {
  const errors: string[] = [];
  if (typeof candidate !== 'object' || candidate === null) {
    throw new Error('AI response is not an object');
  }
  if (typeof candidate.title !== 'string' || candidate.title.length === 0) {
    errors.push('title must be non-empty string');
  }
  if (!Array.isArray(candidate.chunks)) {
    errors.push('chunks must be an array');
  }
  if (!Array.isArray(candidate.overview)) {
    errors.push('overview must be an array of strings');
  }
  if (typeof candidate.servings !== 'number') {
    errors.push('servings must be a number');
  }
  if (typeof candidate.difficulty !== 'string') {
    errors.push('difficulty must be a string');
  }
  if (typeof candidate.totalPrepTime !== 'number') {
    errors.push('totalPrepTime must be a number');
  }
  if (typeof candidate.totalCookTime !== 'number') {
    errors.push('totalCookTime must be a number');
  }

  // Validate chunks structure
  if (Array.isArray(candidate.chunks)) {
    candidate.chunks.forEach((chunk: any, index: number) => {
      if (typeof chunk.title !== 'string' || chunk.title.length === 0) {
        errors.push(`chunks[${index}].title must be non-empty string`);
      }
      if (!Array.isArray(chunk.ingredients)) {
        errors.push(`chunks[${index}].ingredients must be an array of strings`);
      }
      if (!Array.isArray(chunk.recipeSteps)) {
        errors.push(`chunks[${index}].recipeSteps must be an array`);
      }
      if (typeof chunk.prepTime !== 'number') {
        errors.push(`chunks[${index}].prepTime must be a number`);
      }
      if (typeof chunk.cookTime !== 'number') {
        errors.push(`chunks[${index}].cookTime must be a number`);
      }
      if (typeof chunk.orderIndex !== 'number') {
        errors.push(`chunks[${index}].orderIndex must be a number`);
      }
      if (typeof chunk.servings !== 'number') {
        errors.push(`chunks[${index}].servings must be a number`);
      }
      if (typeof chunk.difficulty !== 'string') {
        errors.push(`chunks[${index}].difficulty must be a string`);
      }
      if (!Array.isArray(chunk.tags)) {
        errors.push(`chunks[${index}].tags must be an array of strings`);
      }
      if (typeof chunk.rating !== 'number') {
        errors.push(`chunks[${index}].rating must be a number`);
      }

      // Validate recipeSteps structure within chunks
      if (Array.isArray(chunk.recipeSteps)) {
        chunk.recipeSteps.forEach((step: any, stepIndex: number) => {
          if (typeof step !== 'object' || step === null) {
            errors.push(
              `chunks[${index}].recipeSteps[${stepIndex}] must be an object`
            );
            return;
          }
          if (step.type !== 'text' && step.type !== 'image') {
            errors.push(
              `chunks[${index}].recipeSteps[${stepIndex}].type must be 'text' or 'image'`
            );
          }
          if (typeof step.content !== 'string') {
            errors.push(
              `chunks[${index}].recipeSteps[${stepIndex}].content must be a string`
            );
          }
          if (
            step.type === 'image' &&
            step.imageUrl !== undefined &&
            typeof step.imageUrl !== 'string'
          ) {
            errors.push(
              `chunks[${index}].recipeSteps[${stepIndex}].imageUrl must be a string when provided`
            );
          }
        });
      }
    });
  }

  if (errors.length > 0) {
    throw new Error(`AI JSON validation failed: ${errors.join(', ')}`);
  }
}

async function storeInventedRecipe(
  recipe: RecipeType,
  task: InventTask,
  aiQuery: string,
  aiResponse: string
): Promise<Recipe> {
  const db = new DatabaseService();
  await db.initialize();

  // Prepare recipe data for the database
  const recipeForDatabase: RecipeType = {
    ...recipe,
    author: 'AI Chef',
    sourceUrl: undefined, // No source URL for invented recipes
    scrapedHtml: undefined,
    aiQuery: aiQuery,
    aiResponse: aiResponse,
    urlMappings: undefined,
    scrapedAt: new Date().toISOString(),
  };

  // Save recipe with chunks
  const savedRecipe = await db.saveRecipe(recipeForDatabase);
  return savedRecipe;
}

async function runDirect(task: InventTask): Promise<void> {
  const redis = new RedisService();
  try {
    const result = await processRecipeInvention(task);
    const savedRecipe = await storeInventedRecipe(
      result.recipe,
      task,
      result.aiQuery,
      result.aiResponse
    );

    await redis.publishProgress({
      url: task.id, // Use task ID as URL for progress tracking
      stage: 'ai_processed',
      timestamp: Date.now(),
      recipeId: savedRecipe.id,
      userId: task.userId,
    });

    await redis.publishProgress({
      url: task.id,
      stage: 'stored',
      timestamp: Date.now(),
      recipeId: savedRecipe.id,
      userId: task.userId,
    });

    logger.info('recipe invention + store succeeded', {
      taskId: task.id,
      title: task.title,
    });
  } catch (err) {
    const message = (err as Error).message || String(err);
    await redis.publishProgress({
      url: task.id,
      stage: 'failed',
      timestamp: Date.now(),
      error: message,
      userId: task.userId,
    });
    logger.error('recipe invention failed', {
      taskId: task.id,
      error: message,
    });
  } finally {
    await redis.close();
  }
}

async function runQueue(): Promise<void> {
  const redis = new RedisService();

  const worker = async () => {
    for (;;) {
      try {
        const task = await redis.blockPopInventTask(5);
        if (!task) continue;

        try {
          const claimed = await redis.markInventInProgress(task.id);
          if (!claimed) {
            logger.info('queue skip (claimed elsewhere)', { taskId: task.id });
            continue;
          }

          const result = await processRecipeInvention(task);
          const savedRecipe = await storeInventedRecipe(
            result.recipe,
            task,
            result.aiQuery,
            result.aiResponse
          );

          await redis.publishProgress({
            url: task.id,
            stage: 'ai_processed',
            timestamp: Date.now(),
            recipeId: savedRecipe.id,
            userId: task.userId,
          });

          await redis.publishProgress({
            url: task.id,
            stage: 'stored',
            timestamp: Date.now(),
            recipeId: savedRecipe.id,
            userId: task.userId,
          });

          logger.info('recipe invention + store succeeded', {
            taskId: task.id,
            title: task.title,
          });
        } catch (err) {
          const message = (err as Error).message || String(err);
          logger.error('recipe invention failed', {
            taskId: task.id,
            error: message,
          });
          await redis.publishProgress({
            url: task.id,
            stage: 'failed',
            timestamp: Date.now(),
            error: message,
            userId: task.userId,
          });
        } finally {
          await redis.clearInventInProgress(task.id);
        }
      } catch (e) {
        logger.error('invent worker error', e);
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
  const taskJson = process.argv[2];
  if (taskJson) {
    const task = JSON.parse(taskJson) as InventTask;
    await runDirect(task);
  } else {
    await runQueue();
  }
}

// Only run main if not in test environment
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  main().catch(err => {
    logger.error('inventWorker fatal error', err);
    process.exitCode = 1;
  });
}
