import 'dotenv/config';
import { RedisService } from '../services/redis.service';
import { DatabaseService } from '../services/database.service';
import { RecipeType } from './types';
import { Recipe } from '../interfaces/recipe.interface';
import { config } from '../config';
import { logger } from '../logger';

const CONCURRENCY = config.ai.concurrency;

// URL mapping for AI processing
interface UrlMapping {
  [shortCode: string]: string;
}

let urlCounter = 1;

// Generate a short code for URL mapping
function generateUrlCode(): string {
  return `URL_${urlCounter++}`;
}

// Reset URL counter for testing
export function resetUrlCounter(): void {
  urlCounter = 1;
}

// Replace URLs with short codes for AI processing
export function replaceUrlsWithCodes(html: string): {
  cleanedHtml: string;
  urlMappings: UrlMapping;
} {
  const mappings: UrlMapping = {};
  let processedHtml = html;

  // Replace image URLs
  processedHtml = processedHtml.replace(
    /<img([^>]*?)\s+src\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
    (match, before, src, after) => {
      // Only replace if it looks like a URL (starts with http/https or is a relative path)
      if (src.startsWith('http') || src.startsWith('//') || src.startsWith('/') || src.includes('.')) {
        const shortCode = generateUrlCode();
        mappings[shortCode] = src;
        return `<img${before} src="${shortCode}"${after}>`;
      }
      return match;
    },
  );

  // Replace data-image-url attributes
  processedHtml = processedHtml.replace(/data-image-url\s*=\s*["']([^"']+)["']/gi, (match, url) => {
    // Only replace if it looks like a URL (starts with http/https or is a relative path)
    if (url.startsWith('http') || url.startsWith('//') || url.startsWith('/') || url.includes('.')) {
      const shortCode = generateUrlCode();
      mappings[shortCode] = url;
      return `data-image-url="${shortCode}"`;
    }
    return match;
  });

  // Replace other common URL patterns (href, src in other tags)
  processedHtml = processedHtml.replace(/(href|src|action)\s*=\s*["']([^"']+)["']/gi, (match, attr, url) => {
    // Only replace if it looks like a URL (starts with http/https or is a relative path)
    if (url.startsWith('http') || url.startsWith('//') || url.startsWith('/') || url.includes('.')) {
      const shortCode = generateUrlCode();
      mappings[shortCode] = url;
      return `${attr}="${shortCode}"`;
    }
    return match;
  });

  return { cleanedHtml: processedHtml, urlMappings: mappings };
}

// Restore URLs from short codes after AI processing
export function restoreUrlsFromCodes(content: string, mappings: UrlMapping): string {
  let restored = content;

  Object.entries(mappings).forEach(([shortCode, originalUrl]) => {
    const regex = new RegExp(`"${shortCode}"`, 'g');
    restored = restored.replace(regex, `"${originalUrl}"`);
  });

  return restored;
}

// Restore URLs in recipe object
function restoreUrlsInRecipe(recipe: RecipeType, mappings: UrlMapping): RecipeType {
  const restored = { ...recipe };

  // Restore main imageUrl
  if (restored.imageUrl && mappings[restored.imageUrl]) {
    restored.imageUrl = mappings[restored.imageUrl];
  }

  // Restore URLs in chunks
  if ((restored as any).chunks) {
    (restored as any).chunks = (restored as any).chunks.map((chunk: any) => ({
      ...chunk,
      // Restore chunk imageUrl if present
      imageUrl: chunk.imageUrl && mappings[chunk.imageUrl] ? mappings[chunk.imageUrl] : chunk.imageUrl,
      // Restore URLs in recipeSteps
      recipeSteps: chunk.recipeSteps.map((step: any) => {
        if (step.type === 'image' && step.imageUrl && mappings[step.imageUrl]) {
          return { ...step, imageUrl: mappings[step.imageUrl] };
        }
        return step;
      }),
    }));
  }

  return restored;
}

export function cleanHtml(html: string): string {
  // Remove script tags and their content
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove comment sections - these are costly to process with AI and not useful for recipes
  cleaned = removeCommentSections(cleaned);

  // Preserve recipe images by ensuring img tags are properly formatted
  cleaned = preserveRecipeImages(cleaned);

  // Remove extra whitespace and normalize, but preserve line breaks for better readability
  cleaned = cleaned
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  // Limit payload size to ~128k tokens to avoid OpenAI limits and reduce costs
  cleaned = limitPayloadSize(cleaned, 128000);

  return cleaned;
}

export function preserveRecipeImages(html: string): string {
  // Ensure img tags have proper src attributes and are not broken
  let cleaned = html;

  // Fix common image issues: missing quotes, relative URLs, etc.
  cleaned = cleaned.replace(/<img([^>]*?)\s+src\s*=\s*([^>\s]+)([^>]*?)>/gi, (match, before, src, after) => {
    // Ensure src is properly quoted
    const cleanSrc = src.replace(/^["']|["']$/g, '');
    return `<img${before} src="${cleanSrc}"${after}>`;
  });

  // Add data attributes to make images more visible to AI
  cleaned = cleaned.replace(/<img([^>]*?)\s+src\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
    // Add data-image-url attribute to make the URL more explicit for AI
    const hasDataAttr = before.includes('data-image-url') || after.includes('data-image-url');
    if (!hasDataAttr) {
      return `<img${before} src="${src}" data-image-url="${src}"${after}>`;
    }
    return match;
  });

  return cleaned;
}

export function limitPayloadSize(html: string, maxTokens: number = 128000): string {
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
      truncated.lastIndexOf('?'),
    );

    // Use the better breaking point, but don't go too far back
    const breakPoint = Math.max(lastTagEnd, lastSentenceEnd);
    const safeBreakPoint = Math.max(breakPoint, maxCharacters * 0.9); // Don't go back more than 10%

    return `${html.substring(0, safeBreakPoint)}...`;
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

async function callAiForHtmlCleaning(html: string): Promise<string> {
  const { apiKey } = config.ai;
  const { endpoint } = config.ai;
  if (!apiKey) {
    throw new Error('Missing AI_API_KEY/OPENAI_API_KEY');
  }

  const system =
    'You are an HTML cleaner that removes all HTML tags and elements that are not relevant for recipe extraction. Your goal is to keep only the content that would be useful for understanding and extracting a recipe.';
  const userContent = `Remove all irrelevant HTML from the following content. Keep only:
- Recipe-related content (ingredients, instructions, descriptions, tips)
- Text content related to the recipe
- Recipe images (but remove their img tags, just keep reference to the URL)
- Any metadata about cooking times, servings, difficulty, etc.

Remove:
- Navigation menus
- Headers and footers
- Sidebar content
- Social media widgets
- Comments and reviews sections
- Advertisement blocks
- Website chrome and UI elements
- Script and style tags (already removed, but remove their references)
- Any decorative elements

Return only the cleaned HTML as plain text with minimal markup:

HTML:\n${html}`;

  const requestBody = {
    model: config.ai.model,
    temperature: 0,
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
    throw new Error(`AI cleaning request failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as any;
  return data.choices?.[0]?.message?.content ?? html;
}

async function callAiForRecipe(
  html: string,
  url: string,
): Promise<{
  recipe: RecipeType;
  aiQuery: string;
  aiResponse: string;
  urlMappings: UrlMapping;
}> {
  const { apiKey } = config.ai;
  const { endpoint } = config.ai;
  if (!apiKey) {
    throw new Error('Missing AI_API_KEY/OPENAI_API_KEY');
  }

  // Replace URLs with short codes to reduce token usage
  const { cleanedHtml: htmlWithCodes, urlMappings } = replaceUrlsWithCodes(html);

  // Enhanced prompt to preserve original recipe content while adding meaningful overview
  const system =
    'You are a recipe parser that extracts structured recipe JSON while preserving the original content as faithfully as possible. Your goal is to maintain the authenticity of the original recipe while adding only a helpful overview section. Respond with strict JSON matching the schema.';
  const userContent = `Extract a recipe object with fields: title(string), description(string), overview(string[]), totalPrepTime(number), totalCookTime(number), servings(number), difficulty("easy"|"medium"|"hard"), tags(string[]), imageUrl(string), rating(number), author(string), chunks({title(string), description?(string), ingredients(string[]), recipeSteps({type:"text"|"image",content,imageUrl?}[]), prepTime(number), cookTime(number), servings(number), difficulty("easy"|"medium"|"hard"), tags(string[]), imageUrl?(string), rating(number), orderIndex(number)}[]). 

CRITICAL INSTRUCTIONS:
1. PRESERVE ORIGINAL CONTENT: Extract ingredients, description, and recipeSteps exactly as they appear in the original recipe. Do not modify, summarize, or rewrite the original content.
2. OVERVIEW SECTION: Add a brief overview (2-4 sentences) that provides a global presentation of the recipe and highlights important things to keep in mind (cooking techniques, key ingredients, special notes, etc.). This should be helpful context, not a summary of steps.
3. IMAGES: Preserve all original recipe images. Extract image URLs from the HTML and include them in recipeSteps with type:"image" where they appear in the original recipe flow. IMPORTANT: URLs in the HTML have been replaced with short codes (like URL_1, URL_2, etc.) to reduce token usage. Extract these codes exactly as they appear and include them in the imageUrl field. The codes will be restored to actual URLs later.
4. NO RECIPE STEPS GENERATION: Do not generate or create recipe steps. Only extract the exact steps as they appear in the original recipe.
5. CHUNKS STRUCTURE: ALL recipes must have a chunks array. Analyze the recipe structure carefully to determine if it should be split into multiple chunks. Create multiple chunks when you detect ANY of these patterns:

MULTI-CHUNK INDICATORS (create separate chunks for each):
- Explicit part divisions: "Part 1:", "Part 2:", "Step 1:", "Step 2:", "Phase 1:", "Phase 2:", etc.
- Separate component recipes: "Dough:", "Filling:", "Sauce:", "Garnish:", "Topping:", "Base:", "Crust:", "Frosting:", etc.
- Different preparation methods: "For the cake:", "For the frosting:", "For the filling:", "For the glaze:", etc.
- Sequential preparation stages: "First, prepare...", "Then, make...", "Finally, assemble...", etc.
- Different cooking techniques: "Steamed portion:", "Fried portion:", "Baked portion:", etc.
- Separate ingredient lists with distinct purposes: ingredients for dough vs filling, base vs topping, etc.
- Different timing requirements: "Prepare 2 hours ahead:", "Make the day before:", "Last minute preparation:", etc.
- Assembly instructions: "To assemble:", "To serve:", "Final presentation:", etc.

SINGLE-CHUNK RECIPES (create one chunk with orderIndex 0):
- Simple, linear recipes with one ingredient list and sequential steps
- Recipes where all ingredients are used together in the same preparation
- Recipes without distinct component separation

CHUNK NAMING: Use descriptive titles that reflect the component's purpose (e.g., "Dough", "Filling", "Sauce", "Assembly", "Garnish"). If no clear component name exists, use "Part 1", "Part 2", etc.
6. CHUNK METADATA: Each chunk MUST include all required fields: title, ingredients, recipeSteps, prepTime, cookTime, servings, difficulty, tags, rating, orderIndex. Each chunk should inherit metadata (servings, difficulty, tags, rating) from the main recipe unless the chunk has specific different values. If no specific rating is mentioned for a chunk, use the main recipe's rating.
7. TIME CALCULATION: totalPrepTime and totalCookTime should be the sum of all chunks' prepTime and cookTime respectively.
8. DO NOT INCLUDE AN ID FIELD: The database will auto-generate the ID.

IMAGE EXTRACTION EXAMPLE:
- If you find: <img src="URL_1" alt="Recipe step">
- Extract as: {"type": "image", "content": "Recipe step", "imageUrl": "URL_1"}

CHUNK EXAMPLES:
- Single recipe: chunks: [{"title": "Main Recipe", "ingredients": [...], "recipeSteps": [...], "prepTime": 30, "cookTime": 45, "servings": 4, "difficulty": "medium", "tags": [...], "rating": 4.5, "orderIndex": 0, ...}]
- Multi-part recipe: chunks: [{"title": "Dough", "ingredients": [...], "recipeSteps": [...], "prepTime": 20, "cookTime": 0, "servings": 4, "difficulty": "medium", "tags": [...], "rating": 4.5, "orderIndex": 0, ...}, {"title": "Filling", "ingredients": [...], "recipeSteps": [...], "prepTime": 10, "cookTime": 30, "servings": 4, "difficulty": "medium", "tags": [...], "rating": 4.5, "orderIndex": 1, ...}]
- Cake with frosting: chunks: [{"title": "Cake", "ingredients": [...], "recipeSteps": [...], "prepTime": 25, "cookTime": 35, "servings": 8, "difficulty": "medium", "tags": [...], "rating": 4.8, "orderIndex": 0, ...}, {"title": "Frosting", "ingredients": [...], "recipeSteps": [...], "prepTime": 15, "cookTime": 0, "servings": 8, "difficulty": "easy", "tags": [...], "rating": 4.8, "orderIndex": 1, ...}, {"title": "Assembly", "ingredients": [], "recipeSteps": [...], "prepTime": 10, "cookTime": 0, "servings": 8, "difficulty": "easy", "tags": [...], "rating": 4.8, "orderIndex": 2, ...}]
- Pizza recipe: chunks: [{"title": "Dough", "ingredients": [...], "recipeSteps": [...], "prepTime": 15, "cookTime": 0, "servings": 4, "difficulty": "medium", "tags": [...], "rating": 4.2, "orderIndex": 0, ...}, {"title": "Sauce", "ingredients": [...], "recipeSteps": [...], "prepTime": 10, "cookTime": 20, "servings": 4, "difficulty": "easy", "tags": [...], "rating": 4.2, "orderIndex": 1, ...}, {"title": "Assembly & Baking", "ingredients": [...], "recipeSteps": [...], "prepTime": 5, "cookTime": 15, "servings": 4, "difficulty": "easy", "tags": [...], "rating": 4.2, "orderIndex": 2, ...}]

Source URL: ${url}. HTML:\n${htmlWithCodes}`;

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
    urlMappings,
  };
}

async function processRecipe(
  url: string,
  html: string,
): Promise<{
  recipe: RecipeType;
  aiQuery: string;
  aiResponse: string;
  urlMappings: UrlMapping;
  advancedCleanedHtml?: string;
}> {
  // Step 1: Basic programmatic cleaning
  const basicCleanedHtml = cleanHtml(html);

  // Step 2: AI-powered cleaning to remove irrelevant HTML tags
  const advancedCleanedHtml = await callAiForHtmlCleaning(basicCleanedHtml);

  // Step 3: Extract recipe from advanced cleaned HTML
  const result = await callAiForRecipe(advancedCleanedHtml, url);

  // Restore URLs in the recipe
  const restoredRecipe = restoreUrlsInRecipe(result.recipe, result.urlMappings);

  return {
    ...result,
    recipe: restoredRecipe,
    advancedCleanedHtml,
  };
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

  // Validate chunks structure (all recipes must have chunks)
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
            errors.push(`chunks[${index}].recipeSteps[${stepIndex}] must be an object`);
            return;
          }
          if (step.type !== 'text' && step.type !== 'image') {
            errors.push(`chunks[${index}].recipeSteps[${stepIndex}].type must be 'text' or 'image'`);
          }
          if (typeof step.content !== 'string') {
            errors.push(`chunks[${index}].recipeSteps[${stepIndex}].content must be a string`);
          }
          if (step.type === 'image' && step.imageUrl !== undefined && typeof step.imageUrl !== 'string') {
            errors.push(`chunks[${index}].recipeSteps[${stepIndex}].imageUrl must be a string when provided`);
          }
        });
      }
    });
  }

  if (errors.length > 0) {
    throw new Error(`AI JSON validation failed: ${errors.join(', ')}`);
  }
}

interface StoreRecipeParams {
  recipe: RecipeType;
  url: string;
  html: string;
  advancedCleanedHtml?: string;
  aiQuery: string;
  aiResponse: string;
  urlMappings: UrlMapping;
}

async function storeRecipe(params: StoreRecipeParams): Promise<Recipe> {
  const { recipe, url, html, advancedCleanedHtml, aiQuery, aiResponse, urlMappings } = params;

  // Note: In a production environment, you would inject DatabaseService
  // For now, we'll create a new instance for the worker
  const db = new DatabaseService();
  await db.initialize();

  // Prepare recipe data for the new chunk-based structure
  const recipeForDatabase: RecipeType = {
    ...recipe,
    sourceUrl: url,
    scrapedHtml: html,
    advancedCleanedHtml,
    aiQuery,
    aiResponse,
    urlMappings,
    scrapedAt: new Date().toISOString(),
  };

  // Save recipe with chunks - the database service handles chunk creation automatically
  const savedRecipe = await db.saveRecipe(recipeForDatabase);

  return savedRecipe;
}

async function runDirect(url: string, html: string): Promise<void> {
  const redis = new RedisService();
  try {
    const result = await processRecipe(url, html);
    const savedRecipe = await storeRecipe({
      recipe: result.recipe,
      url,
      html,
      advancedCleanedHtml: result.advancedCleanedHtml,
      aiQuery: result.aiQuery,
      aiResponse: result.aiResponse,
      urlMappings: result.urlMappings,
    });
    await redis.publishProgress({
      url,
      stage: 'ai_processed',
      timestamp: Date.now(),
      recipeId: savedRecipe.id,
    });
    await redis.publishProgress({
      url,
      stage: 'stored',
      timestamp: Date.now(),
      recipeId: savedRecipe.id,
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
          const savedRecipe = await storeRecipe({
            recipe: result.recipe,
            url: task.url,
            html: task.html,
            advancedCleanedHtml: result.advancedCleanedHtml,
            aiQuery: result.aiQuery,
            aiResponse: result.aiResponse,
            urlMappings: result.urlMappings,
          });
          await redis.publishProgress({
            url: task.url,
            stage: 'ai_processed',
            timestamp: Date.now(),
            recipeId: savedRecipe.id,
          });
          await redis.publishProgress({
            url: task.url,
            stage: 'stored',
            timestamp: Date.now(),
            recipeId: savedRecipe.id,
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

// Only run main if not in test environment
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  main().catch(err => {
    logger.error('aiWorker fatal error', err);
    process.exitCode = 1;
  });
}
