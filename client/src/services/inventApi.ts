import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export enum RecipeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum RecipeCuisine {
  FRENCH = 'french',
  ITALIAN = 'italian',
  ASIAN = 'asian',
  MEXICAN = 'mexican',
  MEDITERRANEAN = 'mediterranean',
  AMERICAN = 'american',
  INDIAN = 'indian',
  JAPANESE = 'japanese',
  THAI = 'thai',
  CHINESE = 'chinese',
  OTHER = 'other',
}

export enum RecipeType {
  APPETIZER = 'appetizer',
  MAIN_COURSE = 'main_course',
  DESSERT = 'dessert',
  SIDE_DISH = 'side_dish',
  SOUP = 'soup',
  SALAD = 'salad',
  BREAKFAST = 'breakfast',
  SNACK = 'snack',
  BEVERAGE = 'beverage',
}

export interface InventRecipeRequest {
  title: string;
  description?: string;
  cuisine?: RecipeCuisine;
  type?: RecipeType;
  difficulty?: RecipeDifficulty;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  ingredients?: string[];
  dietaryRestrictions?: string[];
  cookingMethods?: string[];
  specialInstructions?: string;
}

export interface InventRecipeResponse {
  message: string;
  taskId: string;
  title: string;
  queued: boolean;
}

export interface QueueStatusResponse {
  processing: number;
  ai: number;
  invent: number;
  timestamp: number;
}

export const inventApi = createApi({
  reducerPath: 'inventApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  }),
  tagTypes: ['QueueStatus'],
  endpoints: builder => ({
    inventRecipe: builder.mutation<InventRecipeResponse, InventRecipeRequest>({
      query: body => ({
        url: '/invent',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['QueueStatus'],
    }),
    getQueueStatus: builder.query<QueueStatusResponse, void>({
      query: () => '/scrape/queue/status',
      providesTags: ['QueueStatus'],
    }),
  }),
});

export const { useInventRecipeMutation, useGetQueueStatusQuery } = inventApi;
