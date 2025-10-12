import React, { useState, useEffect } from 'react';
import { useRecipes } from '../hooks';

const FilterBar: React.FC = () => {
  const { recipes, searchQuery, selectedTags, applyFilters, clearFilters } =
    useRecipes();

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Get all unique tags from recipes
  const allTags = Array.from(
    new Set(recipes.flatMap(recipe => recipe.tags))
  ).sort();

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters(localSearchQuery, selectedTags);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, selectedTags, applyFilters]);

  const handleTagToggle = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];

    applyFilters(searchQuery, newSelectedTags);
  };

  const handleClearFilters = () => {
    setLocalSearchQuery('');
    clearFilters();
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8">
      <div className="flex flex-col space-y-6">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search recipes..."
            value={localSearchQuery}
            onChange={e => setLocalSearchQuery(e.target.value)}
            className="block w-full px-4 py-4 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-gray-900"
          />
        </div>

        {/* Tag Filters */}
        <div>
          <div className="flex flex-wrap gap-1 items-center">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                  selectedTags.includes(tag)
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 border border-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
            {(searchQuery || selectedTags.length > 0) && (
              <button
                onClick={handleClearFilters}
                className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-full border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 ml-2"
                title="Clear all filters"
              >
                <svg
                  className="w-4 h-4"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
