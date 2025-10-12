export interface RecipeStep {
  type: 'text' | 'image';
  content: string;
  imageUrl?: string;
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
}

export interface RecipeFilters {
  tag?: string;
  ingredient?: string;
  difficulty?: string;
  author?: string;
}
