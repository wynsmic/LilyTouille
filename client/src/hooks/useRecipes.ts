import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  setRecipes,
  setLoading,
  setError,
  toggleFavorite,
  setFavorites,
  filterRecipes,
  setSearchQuery,
  setSelectedTags,
} from '../store/recipeSlice';
import { Recipe } from '../data/recipes';

// Mock data for now - this will be replaced with API calls later
import { recipes as mockRecipes } from '../data/recipes';

export const useRecipes = () => {
  const dispatch = useDispatch();
  const state = useSelector((state: RootState) => state.recipes);

  // Fetch recipes (currently using mock data)
  const fetchRecipes = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // For now, use mock data. Later this will be replaced with actual API call
      dispatch(setRecipes(mockRecipes));
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : 'Failed to fetch recipes'
        )
      );
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Toggle favorite status of a recipe
  const toggleFavoriteRecipe = useCallback(
    (recipeId: string) => {
      dispatch(toggleFavorite(recipeId));
    },
    [dispatch]
  );

  // Set multiple favorites at once
  const setFavoriteRecipes = useCallback(
    (recipeIds: string[]) => {
      dispatch(setFavorites(recipeIds));
    },
    [dispatch]
  );

  // Filter recipes by search query and tags
  const applyFilters = useCallback(
    (searchQuery?: string, selectedTags?: string[]) => {
      if (searchQuery !== undefined) {
        dispatch(setSearchQuery(searchQuery));
      }
      if (selectedTags !== undefined) {
        dispatch(setSelectedTags(selectedTags));
      }
      dispatch(filterRecipes());
    },
    [dispatch]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    dispatch(setSearchQuery(''));
    dispatch(setSelectedTags([]));
    dispatch(filterRecipes());
  }, [dispatch]);

  // Get favorite recipes
  const favoriteRecipes = state.recipes.filter(recipe =>
    state.favoriteRecipeIds.includes(recipe.id)
  );

  // Check if a recipe is favorite
  const isFavorite = useCallback(
    (recipeId: string) => {
      return state.favoriteRecipeIds.includes(recipeId);
    },
    [state.favoriteRecipeIds]
  );

  return {
    // State
    recipes: state.recipes,
    filteredRecipes: state.filteredRecipes,
    favoriteRecipes,
    searchQuery: state.searchQuery,
    selectedTags: state.selectedTags,
    favoriteRecipeIds: state.favoriteRecipeIds,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    fetchRecipes,
    toggleFavoriteRecipe,
    setFavoriteRecipes,
    applyFilters,
    clearFilters,
    isFavorite,
  };
};
