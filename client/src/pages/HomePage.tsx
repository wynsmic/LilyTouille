import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import FilterBar from '../components/FilterBar';
import RecipeList from '../components/RecipeList';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleRecipeClick = (recipeId: string) => {
    navigate(`/recipe/${recipeId}`);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Discover Amazing Recipes
          </h1>
          <p className="text-gray-600 text-lg">
            Find your next favorite dish from around the world
          </p>
        </div>

        {/* Filter Bar */}
        <FilterBar />

        {/* Recipe List */}
        <RecipeList onRecipeClick={handleRecipeClick} />
      </div>
    </Layout>
  );
};

export default HomePage;
