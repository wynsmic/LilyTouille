import { Request, Response } from 'express';
import { RecipeService } from '../services/RecipeService';
import { RecipeFilters } from '../models/Recipe';

export class RecipeController {
  private recipeService: RecipeService;

  constructor() {
    this.recipeService = new RecipeService();
  }

  /**
   * GET /recipes - Get all recipes with optional filtering
   */
  getAllRecipes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tag, ingredient, difficulty, author } = req.query;

      const filters: RecipeFilters = {};
      if (tag) filters.tag = tag as string;
      if (ingredient) filters.ingredient = ingredient as string;
      if (difficulty) filters.difficulty = difficulty as string;
      if (author) filters.author = author as string;

      const recipes = this.recipeService.getAllRecipes(filters);

      res.json({
        success: true,
        data: recipes,
        count: recipes.length,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
    } catch (error) {
      console.error('Error fetching recipes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recipes',
      });
    }
  };

  /**
   * GET /recipes/:id - Get a single recipe by ID
   */
  getRecipeById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid recipe ID',
        });
        return;
      }

      const recipe = this.recipeService.getRecipeById(id);

      if (!recipe) {
        res.status(404).json({
          success: false,
          error: 'Recipe not found',
        });
        return;
      }

      res.json({
        success: true,
        data: recipe,
      });
    } catch (error) {
      console.error('Error fetching recipe:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recipe',
      });
    }
  };

  /**
   * GET /recipes/tags - Get all available tags
   */
  getAllTags = async (req: Request, res: Response): Promise<void> => {
    try {
      const tags = this.recipeService.getAllTags();

      res.json({
        success: true,
        data: tags,
      });
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tags',
      });
    }
  };

  /**
   * GET /recipes/ingredients - Get all available ingredients
   */
  getAllIngredients = async (req: Request, res: Response): Promise<void> => {
    try {
      const ingredients = this.recipeService.getAllIngredients();

      res.json({
        success: true,
        data: ingredients,
      });
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch ingredients',
      });
    }
  };

  /**
   * GET /recipes/authors - Get all available authors
   */
  getAllAuthors = async (req: Request, res: Response): Promise<void> => {
    try {
      const authors = this.recipeService.getAllAuthors();

      res.json({
        success: true,
        data: authors,
      });
    } catch (error) {
      console.error('Error fetching authors:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch authors',
      });
    }
  };
}
