import { Recipe, RecipeFilters } from '../models/Recipe';
import recipesData from '../data/recipes.json';

export class RecipeService {
  private recipes: Recipe[] = recipesData as Recipe[];

  /**
   * Get all recipes with optional filtering
   */
  getAllRecipes(filters?: RecipeFilters): Recipe[] {
    let filteredRecipes = [...this.recipes];

    if (filters) {
      if (filters.tag) {
        filteredRecipes = filteredRecipes.filter(recipe =>
          recipe.tags.some(tag =>
            tag.toLowerCase().includes(filters.tag!.toLowerCase())
          )
        );
      }

      if (filters.ingredient) {
        filteredRecipes = filteredRecipes.filter(recipe =>
          recipe.ingredients.some(ingredient =>
            ingredient.toLowerCase().includes(filters.ingredient!.toLowerCase())
          )
        );
      }

      if (filters.difficulty) {
        filteredRecipes = filteredRecipes.filter(
          recipe =>
            recipe.difficulty.toLowerCase() ===
            filters.difficulty!.toLowerCase()
        );
      }

      if (filters.author) {
        filteredRecipes = filteredRecipes.filter(recipe =>
          recipe.author.toLowerCase().includes(filters.author!.toLowerCase())
        );
      }
    }

    return filteredRecipes;
  }

  /**
   * Get a single recipe by ID
   */
  getRecipeById(id: number): Recipe | null {
    const recipe = this.recipes.find(recipe => recipe.id === id);
    return recipe || null;
  }

  /**
   * Get recipes by tag
   */
  getRecipesByTag(tag: string): Recipe[] {
    return this.recipes.filter(recipe =>
      recipe.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  /**
   * Get recipes by ingredient
   */
  getRecipesByIngredient(ingredient: string): Recipe[] {
    return this.recipes.filter(recipe =>
      recipe.ingredients.some(ing =>
        ing.toLowerCase().includes(ingredient.toLowerCase())
      )
    );
  }

  /**
   * Get all unique tags
   */
  getAllTags(): string[] {
    const allTags = this.recipes.flatMap(recipe => recipe.tags);
    return [...new Set(allTags)].sort();
  }

  /**
   * Get all unique ingredients
   */
  getAllIngredients(): string[] {
    const allIngredients = this.recipes.flatMap(recipe => recipe.ingredients);
    return [...new Set(allIngredients)].sort();
  }

  /**
   * Get all unique authors
   */
  getAllAuthors(): string[] {
    const allAuthors = this.recipes.map(recipe => recipe.author);
    return [...new Set(allAuthors)].sort();
  }
}
