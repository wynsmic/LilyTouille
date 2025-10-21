export interface ProgressUpdate {
  url: string;
  stage: 'scraped' | 'ai_processed' | 'stored' | 'failed';
  timestamp: number;
  recipeId?: number;
  error?: string;
}

export interface RecipeStep {
  type: 'text' | 'image';
  content: string;
  imageUrl?: string;
}

export interface Chunk {
  id: number;
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
  recipeId: number;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  overview: string[];
  totalPrepTime: number;
  totalCookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl: string;
  rating: number;
  author: string;
  chunks: Chunk[];
  // Scraping metadata
  sourceUrl?: string;
  scrapedHtml?: string;
  aiQuery?: string;
  aiResponse?: string;
  scrapedAt?: string;
}

// Legacy interface for backward compatibility
export interface RecipePart {
  title: string;
  description?: string;
  ingredients: string[];
  recipeSteps: RecipeStep[];
  prepTime?: number;
  cookTime?: number;
}
