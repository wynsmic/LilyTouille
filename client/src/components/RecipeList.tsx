import React from 'react';
import { useRecipes } from '../hooks';
import RecipeCard from './RecipeCard';

interface RecipeListProps {
  onRecipeClick: (recipeId: number) => void;
}

const RecipeList: React.FC<RecipeListProps> = ({ onRecipeClick }) => {
  const { filteredRecipes, isLoading, error } = useRecipes();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-2">Error loading recipes</div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (filteredRecipes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No recipes found</div>
        <p className="text-gray-400">
          Try adjusting your search criteria or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredRecipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} onClick={onRecipeClick} />
      ))}
    </div>
  );
};

export default RecipeList;
