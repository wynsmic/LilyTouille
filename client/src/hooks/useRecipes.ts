import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
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
import { useRecipesQuery } from './useRecipeQueries';
import { recipeApi } from '../services/api';

export const useRecipes = () => {
  const dispatch = useDispatch();
  const state = useSelector((state: RootState) => state.recipes);
  const queryClient = useQueryClient();

  // Use React Query to fetch recipes
  const {
    data: recipes = [],
    isLoading: isRecipesLoading,
    error: recipesError,
    refetch: refetchRecipes,
  } = useRecipesQuery();

  // Sync React Query data with Redux store
  React.useEffect(() => {
    if (recipes.length > 0) {
      dispatch(setRecipes(recipes));
    }
  }, [recipes, dispatch]);

  React.useEffect(() => {
    dispatch(setLoading(isRecipesLoading));
  }, [isRecipesLoading, dispatch]);

  React.useEffect(() => {
    if (recipesError) {
      dispatch(setError(recipesError.message || 'Failed to fetch recipes'));
    } else {
      dispatch(setError(null));
    }
  }, [recipesError, dispatch]);

  // Toggle favorite status of a recipe
  const toggleFavoriteRecipe = useCallback(
    (recipeId: string) => {
      dispatch(toggleFavorite(recipeId));
    },
    [dispatch],
  );

  // Set multiple favorites at once
  const setFavoriteRecipes = useCallback(
    (recipeIds: string[]) => {
      dispatch(setFavorites(recipeIds));
    },
    [dispatch],
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
    [dispatch],
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    dispatch(setSearchQuery(''));
    dispatch(setSelectedTags([]));
    dispatch(filterRecipes());
  }, [dispatch]);

  // Get favorite recipes
  const favoriteRecipes = useMemo(() => {
    return state.recipes.filter(recipe => state.favoriteRecipeIds.includes(recipe.id.toString()));
  }, [state.recipes, state.favoriteRecipeIds]);

  // Check if a recipe is favorite
  const isFavorite = useCallback(
    (recipeId: string) => {
      return state.favoriteRecipeIds.includes(recipeId);
    },
    [state.favoriteRecipeIds],
  );

  // Delete a recipe (no optimistic update; invalidate cache to refetch)
  const deleteRecipeById = useCallback(
    async (recipeId: number, token?: string) => {
      await recipeApi.deleteRecipe(recipeId, token);
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      // Optionally, force an immediate refetch
      // void refetchRecipes();
    },
    [queryClient],
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
    fetchRecipes: refetchRecipes,
    toggleFavoriteRecipe,
    setFavoriteRecipes,
    applyFilters,
    clearFilters,
    isFavorite,
    deleteRecipeById,
  };
};
