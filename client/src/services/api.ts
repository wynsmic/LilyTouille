import axios from 'axios';

// Ensure API URL ends with /api
const normalizedApiUrl = (() => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
})();

// Debug logging
console.log('🔍 Environment check:');
console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('  normalizedApiUrl:', normalizedApiUrl);
console.log('  NODE_ENV:', import.meta.env.NODE_ENV);
console.log('  MODE:', import.meta.env.MODE);

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: normalizedApiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  config => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);

// Recipe interface matching backend
export interface RecipeStep {
  type: 'text' | 'image';
  content: string;
  imageUrl?: string;
}

export interface Chunk {
  id: number;
  title: string;
  description?: string;
  ingredients: string[];
  recipeSteps: RecipeStep[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl?: string;
  rating: number;
  orderIndex: number;
  recipeId: number;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  overview: string[];
  totalPrepTime: number;
  totalCookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl: string;
  rating: number;
  author: string;
  chunks: Chunk[];
  // Scraping metadata
  sourceUrl?: string;
  scrapedHtml?: string;
  aiQuery?: string;
  aiResponse?: string;
  scrapedAt?: string;
  // Ownership & validation
  ownerUserId?: number;
  validatedAt?: string | null;
}

// Legacy interface for backward compatibility
export interface RecipePart {
  title: string;
  description?: string;
  ingredients: string[];
  recipeSteps: RecipeStep[];
  prepTime?: number;
  cookTime?: number;
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
      `/recipes${params.toString() ? `?${params.toString()}` : ''}`,
    );
    return response.data.data;
  },

  // Get a single recipe by ID
  getRecipeById: async (id: number): Promise<Recipe> => {
    const response = await apiClient.get<ApiResponse<Recipe>>(`/recipes/${id}`);
    return response.data.data;
  },

  // Validate a recipe
  validateRecipe: async (id: number, token: string): Promise<void> => {
    await apiClient.put<ApiResponse<void>>(
      `/recipes/${id}/validate`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },

  // Get all available tags
  getAllTags: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>('/recipes/tags');
    return response.data.data;
  },

  // Get all available ingredients
  getAllIngredients: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>('/recipes/ingredients');
    return response.data.data;
  },

  // Get all available authors
  getAllAuthors: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>('/recipes/authors');
    return response.data.data;
  },

  // Delete a recipe by ID
  deleteRecipe: async (id: number, token?: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(
      `/recipes/${id}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    );
  },

  // Create a new recipe with chunks
  createRecipe: async (recipe: Omit<Recipe, 'id'>): Promise<Recipe> => {
    const response = await apiClient.post<ApiResponse<Recipe>>('/recipes', recipe);
    return response.data.data;
  },

  // Get chunks for a specific recipe
  getRecipeChunks: async (recipeId: number): Promise<Chunk[]> => {
    const response = await apiClient.get<ApiResponse<Chunk[]>>(`/recipes/${recipeId}/chunks`);
    return response.data.data;
  },

  // Create a new chunk for a recipe
  createChunk: async (recipeId: number, chunk: Omit<Chunk, 'id' | 'recipeId'>): Promise<Chunk> => {
    const response = await apiClient.post<ApiResponse<Chunk>>(`/recipes/${recipeId}/chunks`, chunk);
    return response.data.data;
  },

  // Update a chunk
  updateChunk: async (recipeId: number, chunkId: number, chunk: Partial<Chunk>): Promise<Chunk> => {
    const response = await apiClient.put<ApiResponse<Chunk>>(`/recipes/${recipeId}/chunks/${chunkId}`, chunk);
    return response.data.data;
  },

  // Delete a chunk
  deleteChunk: async (recipeId: number, chunkId: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/recipes/${recipeId}/chunks/${chunkId}`);
  },
};

// User API service functions
export const userApi = {
  // Get current user
  getCurrentUser: async (token: string) => {
    const response = await apiClient.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Create or update user
  createOrUpdateUser: async (token: string, userData: Record<string, unknown>) => {
    const response = await apiClient.post('/users/me', userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (token: string, preferences: Record<string, unknown>) => {
    const response = await apiClient.put('/users/me/preferences', preferences, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get user favorites
  getFavorites: async (token: string) => {
    const response = await apiClient.get('/users/me/favorites', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Add favorite
  addFavorite: async (token: string, recipeId: number) => {
    const response = await apiClient.post(
      `/users/me/favorites/${recipeId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  // Remove favorite
  removeFavorite: async (token: string, recipeId: number) => {
    await apiClient.delete(`/users/me/favorites/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Check if recipe is favorite
  getFavoriteStatus: async (token: string, recipeId: number) => {
    const response = await apiClient.get(`/users/me/favorites/${recipeId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export default apiClient;
