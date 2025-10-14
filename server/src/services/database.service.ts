import 'dotenv/config';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';
import { RecipeType } from '../workers/types';

export class DatabaseService {
  private readonly recipesPath: string;
  private recipes: RecipeType[] = [];

  constructor() {
    this.recipesPath = path.resolve(__dirname, '..', 'data', 'recipes.json');
  }

  async initialize(): Promise<void> {
    try {
      const data = await readFile(this.recipesPath, 'utf-8');
      this.recipes = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is empty, start with empty array
      this.recipes = [];
      await this.saveRecipes();
    }
  }

  async saveRecipe(recipe: RecipeType): Promise<void> {
    // Generate a unique ID if not provided
    if (!recipe.id) {
      const maxId =
        this.recipes.length > 0
          ? Math.max(...this.recipes.map(r => r.id || 0))
          : 0;
      recipe.id = maxId + 1;
    }

    // Check if recipe already exists (by URL or ID)
    const existingIndex = this.recipes.findIndex(
      r =>
        r.id === recipe.id || (recipe as any).sourceUrl === (r as any).sourceUrl
    );

    if (existingIndex >= 0) {
      // Update existing recipe
      this.recipes[existingIndex] = recipe;
    } else {
      // Add new recipe
      this.recipes.push(recipe);
    }

    await this.saveRecipes();
  }

  async getAllRecipes(): Promise<RecipeType[]> {
    return [...this.recipes];
  }

  async getRecipeById(id: number): Promise<RecipeType | null> {
    return this.recipes.find(r => r.id === id) || null;
  }

  private async saveRecipes(): Promise<void> {
    const dataDir = path.dirname(this.recipesPath);
    await mkdir(dataDir, { recursive: true });
    await writeFile(
      this.recipesPath,
      JSON.stringify(this.recipes, null, 2),
      'utf-8'
    );
  }
}
