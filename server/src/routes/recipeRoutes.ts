import { Router } from 'express';
import { RecipeController } from '../controllers/RecipeController';

const router = Router();
const recipeController = new RecipeController();

// Recipe routes
router.get('/', recipeController.getAllRecipes);
router.get('/tags', recipeController.getAllTags);
router.get('/ingredients', recipeController.getAllIngredients);
router.get('/authors', recipeController.getAllAuthors);
router.get('/:id', recipeController.getRecipeById);

export default router;
