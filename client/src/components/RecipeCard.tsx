import React from 'react';
import { Recipe } from '../data/recipes';
import { useRecipes } from '../hooks';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: (recipeId: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const { toggleFavoriteRecipe, isFavorite } = useRecipes();
  const isRecipeFavorite = isFavorite(recipe.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking favorite button
    toggleFavoriteRecipe(recipe.id);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => onClick(recipe.id)}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full transition-colors ${
              isRecipeFavorite
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            aria-label={
              isRecipeFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
          >
            <svg
              className="w-4 h-4"
              fill={isRecipeFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
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
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {recipe.title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {recipe.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {recipe.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{recipe.tags.length - 3}
            </span>
          )}
        </div>

        <div className="flex justify-between text-sm text-gray-500">
          <span>{recipe.prepTime + recipe.cookTime} min</span>
          <span>{recipe.servings} servings</span>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
