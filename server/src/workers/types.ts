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
}

export type RecipeType = Recipe;
export type RecipeStepType = RecipeStep;
