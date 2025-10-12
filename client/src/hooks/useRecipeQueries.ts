import { useQuery, useQueryClient } from '@tanstack/react-query';
import { recipeApi, RecipeFilters } from '../services/api';

// Query keys for React Query
export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (filters: RecipeFilters) => [...recipeKeys.lists(), filters] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: number) => [...recipeKeys.details(), id] as const,
  tags: () => [...recipeKeys.all, 'tags'] as const,
  ingredients: () => [...recipeKeys.all, 'ingredients'] as const,
  authors: () => [...recipeKeys.all, 'authors'] as const,
};

// Hook to fetch all recipes with optional filters
export const useRecipesQuery = (filters?: RecipeFilters) => {
  return useQuery({
    queryKey: recipeKeys.list(filters || {}),
    queryFn: () => recipeApi.getAllRecipes(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch a single recipe by ID
export const useRecipeQuery = (id: number) => {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => recipeApi.getRecipeById(id),
    enabled: !!id,
  });
};

// Hook to fetch all tags
export const useTagsQuery = () => {
  return useQuery({
    queryKey: recipeKeys.tags(),
    queryFn: recipeApi.getAllTags,
    staleTime: 10 * 60 * 1000, // 10 minutes - tags don't change often
  });
};

// Hook to fetch all ingredients
export const useIngredientsQuery = () => {
  return useQuery({
    queryKey: recipeKeys.ingredients(),
    queryFn: recipeApi.getAllIngredients,
    staleTime: 10 * 60 * 1000, // 10 minutes - ingredients don't change often
  });
};

// Hook to fetch all authors
export const useAuthorsQuery = () => {
  return useQuery({
    queryKey: recipeKeys.authors(),
    queryFn: recipeApi.getAllAuthors,
    staleTime: 10 * 60 * 1000, // 10 minutes - authors don't change often
  });
};

// Hook to invalidate recipes cache
export const useInvalidateRecipes = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: recipeKeys.all });
  };
};
