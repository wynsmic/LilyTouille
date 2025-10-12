import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks';
import { Recipe } from '../services/api';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recipes, toggleFavoriteRecipe, isFavorite } = useRecipes();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const recipe = recipes.find((r: Recipe) => r.id === parseInt(id || '0'));
  const isRecipeFavorite = recipe ? isFavorite(recipe.id.toString()) : false;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!recipe) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Recipe not found
            </h1>
            <button
              onClick={() => navigate('/')}
              className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
            >
              Back to Recipes
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-primary-600 hover:text-primary-800 mb-4 transition-colors"
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
            Back to Recipes
          </button>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Recipe Image */}
          <div className="relative h-64 md:h-80">
            <motion.img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8 }}
            />
            <motion.div
              className="absolute top-4 right-4 flex gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.button
                onClick={() => toggleFavoriteRecipe(recipe.id.toString())}
                className={`p-2 rounded-full transition-colors ${
                  isRecipeFavorite
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
                aria-label={
                  isRecipeFavorite
                    ? 'Remove from favorites'
                    : 'Add to favorites'
                }
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  className="w-5 h-5"
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
              </motion.button>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  recipe.difficulty === 'easy'
                    ? 'bg-green-100 text-green-800'
                    : recipe.difficulty === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {recipe.difficulty}
              </span>
            </motion.div>
          </div>

          <div className="p-6 md:p-8">
            {/* Title and Description */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {recipe.title}
              </h1>
              <p className="text-gray-600 text-lg">{recipe.description}</p>
            </motion.div>

            {/* Tags */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <motion.span
                    key={tag}
                    className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Ingredients and Metadata Section */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ingredients
              </h2>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <ul className="space-y-3">
                  {recipe.ingredients.map((ingredient, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                    >
                      <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{ingredient}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {totalTime}
                  </div>
                  <div className="text-sm text-gray-600">Total Time (min)</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {recipe.servings}
                  </div>
                  <div className="text-sm text-gray-600">Servings</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary-600 capitalize">
                    {recipe.difficulty}
                  </div>
                  <div className="text-sm text-gray-600">Difficulty</div>
                </div>
              </div>
            </motion.div>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Instructions
              </h2>
              <div className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start p-4 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                  >
                    <span className="bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed">
                      {instruction}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Ingredients/Metadata Box */}
        <AnimatePresence>
          {isScrolled && (
            <motion.div
              className="fixed bottom-6 right-6 z-50"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary-500 text-white p-4 rounded-full shadow-lg hover:bg-primary-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      Recipe Info
                    </h3>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Ingredients */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Ingredients
                    </h4>
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700 text-sm">
                            {ingredient}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded text-center">
                      <div className="text-lg font-bold text-primary-600">
                        {totalTime}
                      </div>
                      <div className="text-xs text-gray-600">Total Time</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-center">
                      <div className="text-lg font-bold text-primary-600">
                        {recipe.servings}
                      </div>
                      <div className="text-xs text-gray-600">Servings</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-center">
                      <div className="text-lg font-bold text-primary-600 capitalize">
                        {recipe.difficulty}
                      </div>
                      <div className="text-xs text-gray-600">Difficulty</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default RecipeDetail;
