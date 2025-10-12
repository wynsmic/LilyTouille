import React from 'react';
import { Recipe } from '../services/api';
import { useRecipes } from '../hooks';
import { Favorite, FavoriteBorder } from '@mui/icons-material';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: (recipeId: number) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const { toggleFavoriteRecipe, isFavorite } = useRecipes();
  const isRecipeFavorite = isFavorite(recipe.id.toString());

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking favorite button
    toggleFavoriteRecipe(recipe.id.toString());
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer flex items-center justify-between p-4 relative"
      onClick={() => onClick(recipe.id)}
    >
      {/* Favorite button - positioned at top left of card */}
      <button
        onClick={handleFavoriteClick}
        className={`transition-colors z-10 bg-transparent border-none p-0 m-0 cursor-pointer ${
          isRecipeFavorite
            ? 'text-red-500 hover:text-red-600'
            : 'text-gray-400 hover:text-red-500'
        }`}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          outline: 'none',
          flex: '0 0 auto ',
          width: '32px',
          marginRight: '8px',
          textAlign: 'center',
        }}
        aria-label={
          isRecipeFavorite ? 'Remove from favorites' : 'Add to favorites'
        }
      >
        {isRecipeFavorite ? (
          <Favorite className="w-4 h-4" />
        ) : (
          <FavoriteBorder className="w-4 h-4" />
        )}
      </button>

      {/* Content section */}
      <div className="flex-1 pr-1 pl-8" style={{ flex: '1 1 auto' }}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1 mr-2">
            {recipe.title}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
              recipe.difficulty === 'easy'
                ? 'bg-green-100 text-green-800'
                : recipe.difficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {recipe.difficulty}
          </span>
        </div>

        <p className="text-gray-600 text-xs mb-2 line-clamp-2">
          {recipe.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-2">
          {recipe.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {recipe.tags.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{recipe.tags.length - 2}
            </span>
          )}
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>{recipe.prepTime + recipe.cookTime} min</span>
          <span>{recipe.servings} servings</span>
        </div>
      </div>

      {/* Image section - small and constant size on the right */}
      <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-xl shadow-sm">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover"
          style={{
            maxWidth: '64px',
            maxHeight: '64px',
            minWidth: '64px',
            minHeight: '64px',
          }}
        />
      </div>
    </div>
  );
};

export default RecipeCard;
