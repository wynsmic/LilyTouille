import type { Recipe, RecipeStep } from '@/interfaces/recipe.interface';

export type TaskStatus =
  | 'queued'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'retry';

export interface QueueMessage<T = unknown> {
  id: string;
  type: string;
  payload: T;
  createdAt: number;
  attempts: number;
}

export interface ScrapeTaskPayload {
  url: string;
}

export interface AiTaskPayload {
  url: string;
  html: string;
}

export interface ProgressUpdate {
  url: string;
  stage: 'scraped' | 'ai_processed' | 'stored' | 'failed';
  timestamp: number;
  // Present when stage === 'stored'
  recipeId?: number;
  // Present when stage === 'failed'
  error?: string;
  // User ID for targeted broadcasting
  userId?: string;
}

// AI Worker Recipe Chunk - represents a recipe chunk during AI processing
export interface AiWorkerRecipeChunk {
  title: string;
  description?: string;
  ingredients: string[];
  recipeSteps: RecipeStep[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl?: string;
  rating: number;
  orderIndex: number;
}

// AI Worker Recipe Type - extends base Recipe with AI-specific fields
export interface AiWorkerRecipe extends Omit<Recipe, 'id' | 'chunks'> {
  // Override id to be optional for new recipes
  id?: number;
  // Add chunks for chunked recipes (even mono-chunked recipes have one chunk)
  chunks: AiWorkerRecipeChunk[];
}

export type RecipeType = AiWorkerRecipe;
export type RecipeStepType = RecipeStep;
