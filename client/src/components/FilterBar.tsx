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
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex flex-col space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search recipes by name, description, or ingredients..."
            value={localSearchQuery}
            onChange={e => setLocalSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Tag Filters */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              Filter by tags:
            </h3>
            {(searchQuery || selectedTags.length > 0) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchQuery || selectedTags.length > 0) && (
          <div className="text-sm text-gray-600">
            {searchQuery && <span>Searching for: "{searchQuery}"</span>}
            {searchQuery && selectedTags.length > 0 && <span> • </span>}
            {selectedTags.length > 0 && (
              <span>Tags: {selectedTags.join(', ')}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
