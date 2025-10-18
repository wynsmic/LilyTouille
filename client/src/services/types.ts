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

export interface RecipePart {
  title: string;
  description?: string;
  ingredients: string[];
  recipeSteps: RecipeStep[];
  prepTime?: number;
  cookTime?: number;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: string[];
  overview: string[];
  recipeSteps: RecipeStep[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl: string;
  rating: number;
  author: string;
  // Chunked recipe support
  parts?: RecipePart[];
  isChunked?: boolean;
  // Scraping metadata
  sourceUrl?: string;
  scrapedHtml?: string;
  aiQuery?: string;
  aiResponse?: string;
  scrapedAt?: string;
}
