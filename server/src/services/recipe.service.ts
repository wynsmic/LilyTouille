import { Injectable } from '@nestjs/common';
import { Recipe, RecipeFilters, Chunk } from '../interfaces/recipe.interface';
import { DatabaseService } from './database.service';
import { CreateRecipeDto, CreateChunkDto } from '../dto/recipe.dto';

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

  /**
   * Delete a recipe by ID
   */
  async deleteRecipe(id: number): Promise<boolean> {
    return this.databaseService.deleteRecipe(id);
  }

  /**
   * Check if a user can delete a recipe
   */
  async canDeleteRecipe(id: number, requesterSub: string): Promise<{ allowed: boolean; reason?: string }> {
    const repo = this.databaseService.getRecipeRepository();
    const entity = await repo.findById(id);
    if (!entity) return { allowed: false, reason: 'Recipe not found' };

    const ownerUserId = (entity as any).ownerUserId as number | undefined;
    console.log(`[canDeleteRecipe] Recipe ${id} ownerUserId: ${ownerUserId}, requesterSub: ${requesterSub}`);

    // Allow if ownerUserId matches requester user id
    try {
      const userRepo = this.databaseService.getUserRepository();
      const user = await userRepo.findByAuth0Id(requesterSub);
      console.log(`[canDeleteRecipe] Found user: ${user?.id}, ownerUserId: ${ownerUserId}`);

      if (user && ownerUserId && user.id === ownerUserId) {
        console.log(`[canDeleteRecipe] Access granted: user.id (${user.id}) === ownerUserId (${ownerUserId})`);
        return { allowed: true };
      }
    } catch (error) {
      console.error('[canDeleteRecipe] Error checking user:', error);
      // User not found or other error - continue to return not allowed
    }

    // Future: allow admins by role from JWT
    return { allowed: false, reason: 'Only the creator can delete this recipe' };
  }

  /**
   * Mark recipe validated
   */
  async markRecipeValidated(id: number, _sub: string): Promise<boolean> {
    const repo = this.databaseService.getRecipeRepository();
    const entity = await repo.findById(id);
    if (!entity) return false;
    await repo.update(id, { validatedAt: new Date() } as any);
    return true;
  }

  /**
   * Create a new recipe with chunks
   */
  async createRecipe(createRecipeDto: CreateRecipeDto): Promise<Recipe> {
    const recipeRepository = this.databaseService.getRecipeRepository();
    const chunkRepository = this.databaseService.getChunkRepository();

    // Create recipe entity
    const recipeEntity = await recipeRepository.save({
      title: createRecipeDto.title,
      description: createRecipeDto.description,
      overview: createRecipeDto.overview,
      totalPrepTime: createRecipeDto.totalPrepTime,
      totalCookTime: createRecipeDto.totalCookTime,
      servings: createRecipeDto.servings,
      difficulty: createRecipeDto.difficulty,
      tags: createRecipeDto.tags,
      imageUrl: createRecipeDto.imageUrl,
      rating: createRecipeDto.rating,
      author: createRecipeDto.author,
      sourceUrl: createRecipeDto.sourceUrl,
      scrapedHtml: createRecipeDto.scrapedHtml,
      aiQuery: createRecipeDto.aiQuery,
      aiResponse: createRecipeDto.aiResponse,
      scrapedAt: createRecipeDto.scrapedAt ? new Date(createRecipeDto.scrapedAt) : undefined,
    });

    // Create chunks
    const chunks = await Promise.all(
      createRecipeDto.chunks.map(async (chunkDto, index) => {
        return chunkRepository.save({
          title: chunkDto.title,
          description: chunkDto.description,
          ingredients: chunkDto.ingredients,
          recipeSteps: chunkDto.recipeSteps,
          prepTime: chunkDto.prepTime,
          cookTime: chunkDto.cookTime,
          servings: chunkDto.servings,
          difficulty: chunkDto.difficulty,
          tags: chunkDto.tags,
          imageUrl: chunkDto.imageUrl,
          rating: chunkDto.rating,
          orderIndex: index,
          recipeId: recipeEntity.id,
        });
      }),
    );

    // Return the complete recipe with chunks
    return this.entityToRecipe({ ...recipeEntity, chunks });
  }

  /**
   * Get chunks for a specific recipe
   */
  async getRecipeChunks(recipeId: number): Promise<Chunk[]> {
    const chunkRepository = this.databaseService.getChunkRepository();
    const chunks = await chunkRepository.findByRecipeId(recipeId);
    return chunks.map(chunk => this.entityToChunk(chunk));
  }

  /**
   * Create a new chunk for a recipe
   */
  async createChunk(createChunkDto: CreateChunkDto): Promise<Chunk> {
    const chunkRepository = this.databaseService.getChunkRepository();
    const chunk = await chunkRepository.save({
      title: createChunkDto.title,
      description: createChunkDto.description,
      ingredients: createChunkDto.ingredients,
      recipeSteps: createChunkDto.recipeSteps,
      prepTime: createChunkDto.prepTime,
      cookTime: createChunkDto.cookTime,
      servings: createChunkDto.servings,
      difficulty: createChunkDto.difficulty,
      tags: createChunkDto.tags,
      imageUrl: createChunkDto.imageUrl,
      rating: createChunkDto.rating,
      orderIndex: createChunkDto.orderIndex,
      recipeId: createChunkDto.recipeId,
    });
    return this.entityToChunk(chunk);
  }

  /**
   * Update a chunk
   */
  async updateChunk(id: number, updateData: Partial<CreateChunkDto>): Promise<Chunk | null> {
    const chunkRepository = this.databaseService.getChunkRepository();
    const chunk = await chunkRepository.update(id, updateData);
    return chunk ? this.entityToChunk(chunk) : null;
  }

  /**
   * Delete a chunk
   */
  async deleteChunk(id: number): Promise<boolean> {
    const chunkRepository = this.databaseService.getChunkRepository();
    return chunkRepository.delete(id);
  }

  private entityToRecipe(entity: any): Recipe {
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
      chunks: entity.chunks?.map((chunk: any) => this.entityToChunk(chunk)) || [],
      sourceUrl: entity.sourceUrl,
      scrapedHtml: entity.scrapedHtml,
      aiQuery: entity.aiQuery,
      aiResponse: entity.aiResponse,
      urlMappings: entity.urlMappings,
      scrapedAt: entity.scrapedAt,
      ownerUserId: entity.ownerUserId,
      validatedAt: entity.validatedAt,
    };
  }

  private entityToChunk(entity: any): Chunk {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      ingredients: entity.ingredients,
      recipeSteps: entity.recipeSteps,
      prepTime: entity.prepTime,
      cookTime: entity.cookTime,
      servings: entity.servings,
      difficulty: entity.difficulty,
      tags: entity.tags,
      imageUrl: entity.imageUrl,
      rating: entity.rating,
      orderIndex: entity.orderIndex,
      recipeId: entity.recipeId,
    };
  }
}
