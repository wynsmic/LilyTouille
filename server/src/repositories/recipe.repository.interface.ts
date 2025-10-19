import { RecipeEntity } from '../entities/recipe.entity';
import { RecipeFilters } from '../interfaces/recipe.interface';

export interface IRecipeRepository {
  findAll(filters?: RecipeFilters): Promise<RecipeEntity[]>;
  findById(id: number): Promise<RecipeEntity | null>;
  findBySourceUrl(sourceUrl: string): Promise<RecipeEntity | null>;
  save(recipe: Partial<RecipeEntity>): Promise<RecipeEntity>;
  update(
    id: number,
    recipe: Partial<RecipeEntity>
  ): Promise<RecipeEntity | null>;
  delete(id: number): Promise<boolean>;
  findAllTags(): Promise<string[]>;
  findAllIngredients(): Promise<string[]>;
  findAllAuthors(): Promise<string[]>;
  findByTag(tag: string): Promise<RecipeEntity[]>;
  findByIngredient(ingredient: string): Promise<RecipeEntity[]>;
  findByAuthor(author: string): Promise<RecipeEntity[]>;
}
