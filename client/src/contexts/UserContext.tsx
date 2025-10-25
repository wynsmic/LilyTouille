import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Recipe } from '../services/api';

export interface User {
  id: number;
  auth0Id: string;
  email?: string;
  name?: string;
  picture?: string;
  language: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    dietaryRestrictions?: string[];
    cookingSkill?: 'beginner' | 'intermediate' | 'advanced';
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserFavorite {
  id: number;
  recipeId: number;
  createdAt: string;
  recipe?: Recipe;
}

export interface UpdateUserPreferencesRequest {
  language?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    dietaryRestrictions?: string[];
    cookingSkill?: 'beginner' | 'intermediate' | 'advanced';
  };
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  updatePreferences: (
    preferences: UpdateUserPreferencesRequest
  ) => Promise<void>;
  favorites: UserFavorite[];
  favoritesLoading: boolean;
  addFavorite: (recipeId: number) => Promise<void>;
  removeFavorite: (recipeId: number) => Promise<void>;
  isFavorite: (recipeId: number) => boolean;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const {
    user: auth0User,
    isAuthenticated,
    getAccessTokenSilently,
  } = useAuth0();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);

  // Query for user data
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['user', auth0User?.sub],
    queryFn: async () => {
      if (!isAuthenticated || !auth0User) return null;

      const token = await getAccessTokenSilently();
      const response = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.user;
    },
    enabled: isAuthenticated && !!auth0User,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for user favorites
  const { data: favoritesData, isLoading: favoritesLoading } = useQuery({
    queryKey: ['user-favorites', user?.id],
    queryFn: async () => {
      if (!user) return { favorites: [] };

      const token = await getAccessTokenSilently();
      const response = await api.get('/users/me/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create or update user mutation
  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!auth0User) throw new Error('No Auth0 user');

      const token = await getAccessTokenSilently();
      const response = await api.post(
        '/users/me',
        {
          auth0Id: auth0User.sub,
          email: auth0User.email,
          name: auth0User.name,
          picture: auth0User.picture,
          language: 'en',
          preferences: {
            theme: 'auto',
            notifications: true,
            dietaryRestrictions: [],
            cookingSkill: 'beginner',
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    },
    onSuccess: data => {
      setUser(data);
      queryClient.setQueryData(['user', auth0User?.sub], { user: data });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: UpdateUserPreferencesRequest) => {
      const token = await getAccessTokenSilently();
      const response = await api.put('/users/me/preferences', preferences, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    },
    onSuccess: data => {
      if (user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        queryClient.setQueryData(['user', auth0User?.sub], {
          user: updatedUser,
        });
      }
    },
  });

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      const token = await getAccessTokenSilently();
      await api.post(
        `/users/me/favorites/${recipeId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      const token = await getAccessTokenSilently();
      await api.delete(`/users/me/favorites/${recipeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
    },
  });

  // Effects
  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
    } else if (isAuthenticated && auth0User && !userData && !userLoading) {
      // User doesn't exist in our database, create them
      createUserMutation.mutate();
    }
  }, [userData, isAuthenticated, auth0User, userLoading]);

  const updatePreferences = async (
    preferences: UpdateUserPreferencesRequest
  ) => {
    await updatePreferencesMutation.mutateAsync(preferences);
  };

  const addFavorite = async (recipeId: number) => {
    await addFavoriteMutation.mutateAsync(recipeId);
  };

  const removeFavorite = async (recipeId: number) => {
    await removeFavoriteMutation.mutateAsync(recipeId);
  };

  const isFavorite = (recipeId: number): boolean => {
    return (
      favoritesData?.favorites?.some(
        (fav: UserFavorite) => fav.recipeId === recipeId
      ) || false
    );
  };

  const refreshUser = () => {
    refetchUser();
  };

  const contextValue: UserContextType = {
    user,
    isLoading: userLoading || createUserMutation.isPending,
    error: userError || createUserMutation.error,
    updatePreferences,
    favorites: favoritesData?.favorites || [],
    favoritesLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshUser,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
