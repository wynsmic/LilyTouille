import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RecipeService } from '../services/recipe.service';
import { UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { Auth0Guard, AuthenticatedRequest } from '../guards/auth0.guard';
import { RecipeFiltersDto, CreateRecipeDto, CreateChunkDto } from '../dto/recipe.dto';
import { RecipeFilters } from '../interfaces/recipe.interface';

@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  /**
   * GET /recipes - Get all recipes with optional filtering
   */
  @Get()
  async getAllRecipes(@Query() query: RecipeFiltersDto) {
    const filters: RecipeFilters = {};
    if (query.tag) filters.tag = query.tag;
    if (query.ingredient) filters.ingredient = query.ingredient;
    if (query.difficulty) filters.difficulty = query.difficulty;
    if (query.author) filters.author = query.author;

    const recipes = await this.recipeService.getAllRecipes(filters);

    return {
      success: true,
      data: recipes,
      count: recipes.length,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    };
  }

  /**
   * GET /recipes/tags - Get all available tags
   */
  @Get('tags')
  async getAllTags() {
    const tags = await this.recipeService.getAllTags();

    return {
      success: true,
      data: tags,
    };
  }

  /**
   * GET /recipes/ingredients - Get all available ingredients
   */
  @Get('ingredients')
  async getAllIngredients() {
    const ingredients = await this.recipeService.getAllIngredients();

    return {
      success: true,
      data: ingredients,
    };
  }

  /**
   * GET /recipes/authors - Get all available authors
   */
  @Get('authors')
  async getAllAuthors() {
    const authors = await this.recipeService.getAllAuthors();

    return {
      success: true,
      data: authors,
    };
  }

  /**
   * GET /recipes/:id - Get a single recipe by ID
   */
  @Get(':id')
  async getRecipeById(@Param('id', ParseIntPipe) id: number) {
    const recipe = await this.recipeService.getRecipeById(id);

    if (!recipe) {
      throw new HttpException('Recipe not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: recipe,
    };
  }

  /**
   * DELETE /recipes/:id - Delete a recipe by ID
   */
  @Delete(':id')
  @UseGuards(Auth0Guard)
  async deleteRecipe(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    const canDelete = await this.recipeService.canDeleteRecipe(id, req.user!.sub);
    if (!canDelete.allowed) {
      throw new ForbiddenException(canDelete.reason || 'Not allowed to delete this recipe');
    }

    const deleted = await this.recipeService.deleteRecipe(id);

    if (!deleted) {
      throw new HttpException('Recipe not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      message: 'Recipe deleted successfully',
    };
  }

  /**
   * POST /recipes - Create a new recipe with chunks
   */
  @Post()
  async createRecipe(@Body() createRecipeDto: CreateRecipeDto) {
    const recipe = await this.recipeService.createRecipe(createRecipeDto);

    return {
      success: true,
      data: recipe,
      message: 'Recipe created successfully',
    };
  }

  /**
   * PUT /recipes/:id/validate - Mark a recipe as validated by the owner
   */
  @Put(':id/validate')
  @UseGuards(Auth0Guard)
  async validateRecipe(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    const allowed = await this.recipeService.canDeleteRecipe(id, req.user!.sub); // reuse ownership check
    if (!allowed.allowed) {
      throw new ForbiddenException('Only the owner can validate');
    }

    const updated = await this.recipeService.markRecipeValidated(id, req.user!.sub);
    if (!updated) {
      throw new HttpException('Recipe not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      message: 'Recipe validated',
    };
  }

  /**
   * GET /recipes/:id/chunks - Get chunks for a specific recipe
   */
  @Get(':id/chunks')
  async getRecipeChunks(@Param('id', ParseIntPipe) id: number) {
    const chunks = await this.recipeService.getRecipeChunks(id);

    return {
      success: true,
      data: chunks,
      count: chunks.length,
    };
  }

  /**
   * POST /recipes/:id/chunks - Create a new chunk for a recipe
   */
  @Post(':id/chunks')
  async createChunk(
    @Param('id', ParseIntPipe) recipeId: number,
    @Body() createChunkDto: Omit<CreateChunkDto, 'recipeId'>,
  ) {
    const chunk = await this.recipeService.createChunk({
      ...createChunkDto,
      recipeId,
    });

    return {
      success: true,
      data: chunk,
      message: 'Chunk created successfully',
    };
  }

  /**
   * PUT /recipes/:recipeId/chunks/:chunkId - Update a chunk
   */
  @Put(':recipeId/chunks/:chunkId')
  async updateChunk(
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @Param('chunkId', ParseIntPipe) chunkId: number,
    @Body() updateData: Partial<CreateChunkDto>,
  ) {
    const chunk = await this.recipeService.updateChunk(chunkId, updateData);

    if (!chunk) {
      throw new HttpException('Chunk not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: chunk,
      message: 'Chunk updated successfully',
    };
  }

  /**
   * DELETE /recipes/:recipeId/chunks/:chunkId - Delete a chunk
   */
  @Delete(':recipeId/chunks/:chunkId')
  async deleteChunk(
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @Param('chunkId', ParseIntPipe) chunkId: number,
  ) {
    const deleted = await this.recipeService.deleteChunk(chunkId);

    if (!deleted) {
      throw new HttpException('Chunk not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      message: 'Chunk deleted successfully',
    };
  }
}
