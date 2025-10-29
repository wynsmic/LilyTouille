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
  advancedCleanedHtml?: string;
  aiQuery?: string;
  aiResponse?: string;
  urlMappings?: { [shortCode: string]: string };
  scrapedAt?: string;
  // Ownership & validation
  ownerUserId?: number;
  validatedAt?: string | null;
}

export interface RecipeFilters {
  tag?: string;
  ingredient?: string;
  difficulty?: string;
  author?: string;
}
