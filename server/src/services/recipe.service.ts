import { Injectable } from '@nestjs/common';
import { Recipe, RecipeFilters } from '../interfaces/recipe.interface';
import { DatabaseService } from './database.service';

@Injectable()
export class RecipeService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all recipes with optional filtering
   */
  async getAllRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
    return this.databaseService.getAllRecipesWithFilters(filters);
  }

  /**
   * Get a single recipe by ID
   */
  async getRecipeById(id: number): Promise<Recipe | null> {
    return this.databaseService.getRecipeById(id);
  }

  /**
   * Get recipes by tag
   */
  async getRecipesByTag(tag: string): Promise<Recipe[]> {
    const repository = this.databaseService.getRecipeRepository();
    const entities = await repository.findByTag(tag);
    return entities.map(entity => this.entityToRecipe(entity));
  }

  /**
   * Get recipes by ingredient
   */
  async getRecipesByIngredient(ingredient: string): Promise<Recipe[]> {
    const repository = this.databaseService.getRecipeRepository();
    const entities = await repository.findByIngredient(ingredient);
    return entities.map(entity => this.entityToRecipe(entity));
  }

  /**
   * Get all unique tags
   */
  async getAllTags(): Promise<string[]> {
    return this.databaseService.getAllTags();
  }

  /**
   * Get all unique ingredients
   */
  async getAllIngredients(): Promise<string[]> {
    return this.databaseService.getAllIngredients();
  }

  /**
   * Get all unique authors
   */
  async getAllAuthors(): Promise<string[]> {
    return this.databaseService.getAllAuthors();
  }

  private entityToRecipe(entity: any): Recipe {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      ingredients: entity.ingredients,
      overview: entity.overview,
      recipeSteps: entity.recipeSteps,
      prepTime: entity.prepTime,
      cookTime: entity.cookTime,
      servings: entity.servings,
      difficulty: entity.difficulty,
      tags: entity.tags,
      imageUrl: entity.imageUrl,
      rating: entity.rating,
      author: entity.author,
      parts: entity.parts,
      isChunked: entity.isChunked,
      sourceUrl: entity.sourceUrl,
      scrapedHtml: entity.scrapedHtml,
      aiQuery: entity.aiQuery,
      aiResponse: entity.aiResponse,
      urlMappings: entity.urlMappings,
      scrapedAt: entity.scrapedAt,
    };
  }
}
