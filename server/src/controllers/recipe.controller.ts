import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RecipeService } from '../services/recipe.service';
import { RecipeFiltersDto } from '../dto/recipe.dto';
import { RecipeFilters } from '../interfaces/recipe.interface';

@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  /**
   * GET /recipes - Get all recipes with optional filtering
   */
  @Get()
  getAllRecipes(@Query() query: RecipeFiltersDto) {
    const filters: RecipeFilters = {};
    if (query.tag) filters.tag = query.tag;
    if (query.ingredient) filters.ingredient = query.ingredient;
    if (query.difficulty) filters.difficulty = query.difficulty;
    if (query.author) filters.author = query.author;

    const recipes = this.recipeService.getAllRecipes(filters);

    return {
      success: true,
      data: recipes,
      count: recipes.length,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    };
  }

  /**
   * GET /recipes/:id - Get a single recipe by ID
   */
  @Get(':id')
  getRecipeById(@Param('id', ParseIntPipe) id: number) {
    const recipe = this.recipeService.getRecipeById(id);

    if (!recipe) {
      throw new HttpException('Recipe not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: recipe,
    };
  }

  /**
   * GET /recipes/tags - Get all available tags
   */
  @Get('tags')
  getAllTags() {
    const tags = this.recipeService.getAllTags();

    return {
      success: true,
      data: tags,
    };
  }

  /**
   * GET /recipes/ingredients - Get all available ingredients
   */
  @Get('ingredients')
  getAllIngredients() {
    const ingredients = this.recipeService.getAllIngredients();

    return {
      success: true,
      data: ingredients,
    };
  }

  /**
   * GET /recipes/authors - Get all available authors
   */
  @Get('authors')
  getAllAuthors() {
    const authors = this.recipeService.getAllAuthors();

    return {
      success: true,
      data: authors,
    };
  }
}
