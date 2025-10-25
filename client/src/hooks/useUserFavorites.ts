import { useUser } from '../contexts/UserContext';

export const useUserFavorites = () => {
  const {
    favorites,
    favoritesLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
  } = useUser();

  const toggleFavorite = async (recipeId: number) => {
    if (isFavorite(recipeId)) {
      await removeFavorite(recipeId);
    } else {
      await addFavorite(recipeId);
    }
  };

  return {
    favorites,
    favoritesLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
};
