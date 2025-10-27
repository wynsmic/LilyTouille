import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { RecipeEntity } from '../entities/recipe.entity';
import { ChunkEntity } from '../entities/chunk.entity';
import { UserEntity } from '../entities/user.entity';
import { UserFavoriteEntity } from '../entities/user-favorite.entity';
import { RecipeRepository } from '../repositories/recipe.repository';
import {
  ChunkRepository,
  IChunkRepository,
} from '../repositories/chunk.repository';
import { UserRepository } from '../repositories/user.repository';
import {
  UserFavoriteRepository,
  IUserFavoriteRepository,
} from '../repositories/user-favorite.repository';
import { IRecipeRepository } from '../repositories/recipe.repository.interface';
import { IUserRepository } from '../repositories/user.repository.interface';
import { RecipeType } from '../workers/types';
import { Recipe } from '../interfaces/recipe.interface';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private dataSource: DataSource;
  private recipeRepository: IRecipeRepository;
  private chunkRepository: IChunkRepository;
  private userRepository: IUserRepository;
  private userFavoriteRepository: IUserFavoriteRepository;

  async onModuleInit() {
    await this.initialize();
  }

  async onModuleDestroy() {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  async initialize(): Promise<void> {
    this.dataSource = new DataSource({
      type: config.db.type as any,
      url: config.db.url,
      synchronize: config.db.synchronize,
      logging: config.db.logging,
      entities: [RecipeEntity, ChunkEntity, UserEntity, UserFavoriteEntity],
      ssl: config.db.ssl,
    });

    await this.dataSource.initialize();
    this.recipeRepository = new RecipeRepository(this.dataSource);
    this.chunkRepository = new ChunkRepository(
      this.dataSource.getRepository(ChunkEntity),
    );
    this.userRepository = new UserRepository(this.dataSource);
    this.userFavoriteRepository = new UserFavoriteRepository(this.dataSource);

    console.log('Database initialized successfully');
  }

  getRecipeRepository(): IRecipeRepository {
    if (!this.recipeRepository) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.recipeRepository;
  }

  getChunkRepository(): IChunkRepository {
    if (!this.chunkRepository) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.chunkRepository;
  }

  getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.userRepository;
  }

  getUserFavoriteRepository(): IUserFavoriteRepository {
    if (!this.userFavoriteRepository) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.userFavoriteRepository;
  }

  // Save recipe with chunks
  async saveRecipe(recipe: RecipeType): Promise<Recipe> {
    const recipeRepository = this.getRecipeRepository();
    const chunkRepository = this.getChunkRepository();

    // Extract chunks from recipe data
    const { chunks, ...recipeData } = recipe as any;

    // Remove ID from recipe to ensure auto-generation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...recipeWithoutId } = recipeData;

    // Check if recipe already exists by sourceUrl only
    let existingRecipe: RecipeEntity | null = null;

    if (recipeWithoutId.sourceUrl) {
      existingRecipe = await recipeRepository.findBySourceUrl(
        recipeWithoutId.sourceUrl,
      );
    }

    let savedRecipe: RecipeEntity;

    if (existingRecipe) {
      // Update existing recipe
      savedRecipe = (await recipeRepository.update(
        existingRecipe.id,
        recipeWithoutId,
      )) as RecipeEntity;

      // Delete existing chunks and recreate them
      await chunkRepository.deleteByRecipeId(existingRecipe.id);
    } else {
      // Add new recipe (database will auto-generate ID)
      savedRecipe = await recipeRepository.save(recipeWithoutId);
    }

    // Create chunks for the recipe
    if (chunks && chunks.length > 0) {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        await chunkRepository.save({
          title: chunk.title,
          description: chunk.description,
          ingredients: chunk.ingredients || [],
          recipeSteps: chunk.recipeSteps || [],
          prepTime: chunk.prepTime || 0,
          cookTime: chunk.cookTime || 0,
          servings: chunk.servings || savedRecipe.servings,
          difficulty: chunk.difficulty || savedRecipe.difficulty,
          tags: chunk.tags || savedRecipe.tags,
          imageUrl: chunk.imageUrl || savedRecipe.imageUrl,
          rating: chunk.rating || savedRecipe.rating,
          orderIndex: chunk.orderIndex || i,
          recipeId: savedRecipe.id,
        });
      }
    }

    // Return the saved recipe with chunks loaded
    return this.getRecipeById(savedRecipe.id) as Promise<Recipe>;
  }

  async getAllRecipes(): Promise<Recipe[]> {
    const repository = this.getRecipeRepository();
    const entities = await repository.findAll();
    return entities.map(entity => this.entityToRecipe(entity));
  }

  async getRecipeById(id: number): Promise<Recipe | null> {
    const repository = this.getRecipeRepository();
    const entity = await repository.findById(id);
    return entity ? this.entityToRecipe(entity) : null;
  }

  // New methods for enhanced functionality
  async getAllRecipesWithFilters(filters?: any): Promise<Recipe[]> {
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

  private entityToRecipe(entity: RecipeEntity): Recipe {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      overview: entity.overview,
      totalPrepTime: entity.totalPrepTime,
      totalCookTime: entity.totalCookTime,
      servings: entity.servings,
      difficulty: entity.difficulty,
      tags: entity.tags,
      imageUrl: entity.imageUrl,
      rating: entity.rating,
      author: entity.author,
      chunks: entity.chunks || [],
      sourceUrl: entity.sourceUrl,
      scrapedHtml: entity.scrapedHtml,
      advancedCleanedHtml: entity.advancedCleanedHtml,
      aiQuery: entity.aiQuery,
      aiResponse: entity.aiResponse,
      urlMappings: entity.urlMappings,
      scrapedAt: entity.scrapedAt
        ? new Date(entity.scrapedAt).toISOString()
        : undefined,
    } as Recipe;
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
