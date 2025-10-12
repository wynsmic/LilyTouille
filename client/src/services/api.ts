import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  config => {
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  error => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    console.error(
      '❌ API Response Error:',
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

// Recipe interface matching backend
export interface RecipeStep {
  type: 'text' | 'image';
  content: string;
  imageUrl?: string;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: string[];
  overview: string[];
  recipeSteps: RecipeStep[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl: string;
  rating: number;
  author: string;
}

export interface RecipeFilters {
  tag?: string;
  ingredient?: string;
  difficulty?: string;
  author?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  filters?: RecipeFilters;
}

// API service functions
export const recipeApi = {
  // Get all recipes with optional filters
  getAllRecipes: async (filters?: RecipeFilters): Promise<Recipe[]> => {
    const params = new URLSearchParams();
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.ingredient) params.append('ingredient', filters.ingredient);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.author) params.append('author', filters.author);

    const response = await apiClient.get<ApiResponse<Recipe[]>>(
      `/recipes${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data.data;
  },

  // Get a single recipe by ID
  getRecipeById: async (id: number): Promise<Recipe> => {
    const response = await apiClient.get<ApiResponse<Recipe>>(`/recipes/${id}`);
    return response.data.data;
  },

  // Get all available tags
  getAllTags: async (): Promise<string[]> => {
    const response =
      await apiClient.get<ApiResponse<string[]>>('/recipes/tags');
    return response.data.data;
  },

  // Get all available ingredients
  getAllIngredients: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>(
      '/recipes/ingredients'
    );
    return response.data.data;
  },

  // Get all available authors
  getAllAuthors: async (): Promise<string[]> => {
    const response =
      await apiClient.get<ApiResponse<string[]>>('/recipes/authors');
    return response.data.data;
  },
};

export default apiClient;
