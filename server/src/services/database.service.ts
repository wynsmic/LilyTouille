import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { RecipeEntity } from '../entities/recipe.entity';
import { RecipeRepository } from '../repositories/recipe.repository';
import { IRecipeRepository } from '../repositories/recipe.repository.interface';
import { RecipeType } from '../workers/types';
import { Recipe } from '../interfaces/recipe.interface';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private dataSource: DataSource;
  private recipeRepository: IRecipeRepository;

  async onModuleInit() {
    await this.initialize();
  }

  async onModuleDestroy() {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  async initialize(): Promise<void> {
    this.dataSource = new DataSource({
      type: 'sqlite',
      database: config.db.database,
      synchronize: config.db.synchronize,
      logging: config.db.logging,
      entities: [RecipeEntity],
    });

    await this.dataSource.initialize();
    this.recipeRepository = new RecipeRepository(this.dataSource);

    console.log('Database initialized successfully');
  }

  getRecipeRepository(): IRecipeRepository {
    if (!this.recipeRepository) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.recipeRepository;
  }

  // Legacy methods for backward compatibility
  async saveRecipe(recipe: RecipeType): Promise<RecipeType> {
    const repository = this.getRecipeRepository();

    // Remove ID from recipe to ensure auto-generation
    const { id, ...recipeWithoutId } = recipe as any;

    // Check if recipe already exists by sourceUrl only
    let existingRecipe: RecipeEntity | null = null;

    if ((recipe as any).sourceUrl) {
      existingRecipe = await repository.findBySourceUrl(
        (recipe as any).sourceUrl
      );
    }

    let savedRecipe: RecipeEntity;

    if (existingRecipe) {
      // Update existing recipe
      savedRecipe = (await repository.update(
        existingRecipe.id,
        recipeWithoutId
      )) as RecipeEntity;
    } else {
      // Add new recipe (database will auto-generate ID)
      savedRecipe = await repository.save(recipeWithoutId);
    }

    // Return the saved recipe with the correct ID
    return this.entityToRecipe(savedRecipe);
  }

  async getAllRecipes(): Promise<RecipeType[]> {
    const repository = this.getRecipeRepository();
    const entities = await repository.findAll();
    return entities.map(entity => this.entityToRecipe(entity));
  }

  async getRecipeById(id: number): Promise<RecipeType | null> {
    const repository = this.getRecipeRepository();
    const entity = await repository.findById(id);
    return entity ? this.entityToRecipe(entity) : null;
  }

  // New methods for enhanced functionality
  async getAllRecipesWithFilters(filters?: any): Promise<RecipeType[]> {
    const repository = this.getRecipeRepository();
    const entities = await repository.findAll(filters);
    return entities.map(entity => this.entityToRecipe(entity));
  }

  async getAllTags(): Promise<string[]> {
    const repository = this.getRecipeRepository();
    return repository.findAllTags();
  }

  async getAllIngredients(): Promise<string[]> {
    const repository = this.getRecipeRepository();
    return repository.findAllIngredients();
  }

  async getAllAuthors(): Promise<string[]> {
    const repository = this.getRecipeRepository();
    return repository.findAllAuthors();
  }

  async deleteRecipe(id: number): Promise<boolean> {
    const repository = this.getRecipeRepository();
    return repository.delete(id);
  }

  private entityToRecipe(entity: RecipeEntity): RecipeType {
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
      scrapedAt: entity.scrapedAt
        ? new Date(entity.scrapedAt).toISOString()
        : undefined,
    } as RecipeType;
  }

  // Migration method to import existing JSON data
  async migrateFromJson(jsonData: RecipeType[]): Promise<void> {
    const repository = this.getRecipeRepository();

    for (const recipe of jsonData) {
      try {
        await repository.save(recipe as Partial<RecipeEntity>);
      } catch (error) {
        console.warn(`Failed to migrate recipe ${recipe.id}:`, error);
      }
    }

    console.log(`Migrated ${jsonData.length} recipes from JSON to database`);
  }
}
