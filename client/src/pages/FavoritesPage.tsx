import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks';
import Layout from '../components/Layout';
import RecipeCard from '../components/RecipeCard';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { favoriteRecipes } = useRecipes();

  const handleRecipeClick = (recipeId: number) => {
    navigate(`/recipe/${recipeId}`);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Your Favorite Recipes
          </h1>
          <p className="text-gray-600 text-lg">
            {favoriteRecipes.length === 0
              ? "You haven't added any recipes to your favorites yet"
              : `You have ${favoriteRecipes.length} favorite recipe${favoriteRecipes.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-primary-600 hover:text-primary-800 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to All Recipes
          </button>
        </div>

        {/* Favorites List */}
        {favoriteRecipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-500 mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-400 mb-6">
              Start exploring recipes and add them to your favorites!
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Browse Recipes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={handleRecipeClick}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FavoritesPage;
