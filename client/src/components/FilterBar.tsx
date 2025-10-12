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
          {(searchQuery || selectedTags.length > 0) && (
            <div className="flex justify-end mb-4">
              <button
                onClick={handleClearFilters}
                className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-primary-50"
              >
                Clear all
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
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
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchQuery || selectedTags.length > 0) && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-4 h-4 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="text-sm font-medium text-primary-800">
                Active Filters
              </span>
            </div>
            <div className="text-sm text-primary-700">
              {searchQuery && (
                <div className="mb-1">
                  <span className="font-medium">Search:</span> "{searchQuery}"
                </div>
              )}
              {selectedTags.length > 0 && (
                <div>
                  <span className="font-medium">Categories:</span>{' '}
                  {selectedTags.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
