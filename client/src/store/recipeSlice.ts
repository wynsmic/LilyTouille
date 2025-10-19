import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Recipe } from '../services/api';

interface RecipeState {
  recipes: Recipe[];
  filteredRecipes: Recipe[];
  searchQuery: string;
  selectedTags: string[];
  favoriteRecipeIds: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RecipeState = {
  recipes: [],
  filteredRecipes: [],
  searchQuery: '',
  selectedTags: [],
  favoriteRecipeIds: [],
  isLoading: false,
  error: null,
};

const recipeSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    setRecipes: (state, action: PayloadAction<Recipe[]>) => {
      state.recipes = action.payload;
      // Sort recipes by name when they are initially loaded
      state.filteredRecipes = [...action.payload].sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedTags: (state, action: PayloadAction<string[]>) => {
      state.selectedTags = action.payload;
    },
    filterRecipes: state => {
      let filtered = state.recipes;

      // Filter by search query
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(
          recipe =>
            recipe.title.toLowerCase().includes(query) ||
            recipe.description.toLowerCase().includes(query) ||
            recipe.ingredients.some(ingredient =>
              ingredient.toLowerCase().includes(query)
            )
        );
      }

      // Filter by selected tags
      if (state.selectedTags.length > 0) {
        filtered = filtered.filter(recipe =>
          state.selectedTags.some(tag => recipe.tags.includes(tag))
        );
      }

      // Sort by recipe name (title)
      filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));

      state.filteredRecipes = filtered;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const recipeId = action.payload;
      const isFavorite = state.favoriteRecipeIds.includes(recipeId);

      if (isFavorite) {
        state.favoriteRecipeIds = state.favoriteRecipeIds.filter(
          id => id !== recipeId
        );
      } else {
        state.favoriteRecipeIds.push(recipeId);
      }
    },
    setFavorites: (state, action: PayloadAction<string[]>) => {
      state.favoriteRecipeIds = action.payload;
    },
    deleteRecipe: (state, action: PayloadAction<number>) => {
      const recipeId = action.payload;
      state.recipes = state.recipes.filter(recipe => recipe.id !== recipeId);
      state.filteredRecipes = state.filteredRecipes.filter(
        recipe => recipe.id !== recipeId
      );
      // Also remove from favorites if it was favorited
      state.favoriteRecipeIds = state.favoriteRecipeIds.filter(
        id => id !== recipeId.toString()
      );
    },
  },
});

export const {
  setRecipes,
  setSearchQuery,
  setSelectedTags,
  filterRecipes,
  setLoading,
  setError,
  toggleFavorite,
  setFavorites,
  deleteRecipe,
} = recipeSlice.actions;

export default recipeSlice.reducer;
