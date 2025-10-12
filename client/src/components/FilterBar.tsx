import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRecipes } from '../hooks';

const FilterContainer = styled.div`
  background-color: var(--color-white);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-gray-100);
  margin-bottom: var(--space-8);
`;

const FilterContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const SearchContainer = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  display: block;
  width: 100%;
  padding: var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  line-height: 1.25;
  background-color: var(--color-white);
  color: var(--color-gray-900);
  transition: all var(--transition-normal);

  &::placeholder {
    color: var(--color-gray-500);
  }

  &:focus {
    outline: none;
    
    &::placeholder {
      color: var(--color-gray-400);
    }
    
    box-shadow: 0 0 0 1px var(--color-primary-500);
    border-color: var(--color-primary-500);
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  align-items: center;
`;

const TagButton = styled.button<{ $isSelected: boolean }>`
  padding: var(--space-3) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-normal);
  border: ${props => props.$isSelected ? 'none' : '1px solid var(--color-gray-200)'};
  background-color: ${props => props.$isSelected ? 'var(--color-primary-500)' : 'var(--color-gray-50)'};
  color: ${props => props.$isSelected ? 'var(--color-white)' : 'var(--color-gray-600)'};

  &:hover {
    background-color: ${props => props.$isSelected ? 'var(--color-primary-600)' : 'var(--color-gray-100)'};
    color: ${props => props.$isSelected ? 'var(--color-white)' : 'var(--color-gray-800)'};
    border-color: ${props => props.$isSelected ? 'none' : 'var(--color-gray-300)'};
  }
`;

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--color-gray-500);
  background-color: transparent;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-full);
  margin-left: var(--space-2);
  transition: all var(--transition-normal);
  cursor: pointer;

  &:hover {
    color: var(--color-gray-700);
    background-color: var(--color-gray-100);
    border-color: var(--color-gray-300);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary-500);
    opacity: 0.5;
  }
`;

const ClearIcon = styled.svg`
  width: 1rem;
  height: 1rem;
`;

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
    <FilterContainer>
      <FilterContent>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search recipes..."
            value={localSearchQuery}
            onChange={e => setLocalSearchQuery(e.target.value)}
          />
        </SearchContainer>

        <TagsContainer>
          {allTags.map(tag => (
            <TagButton
              key={tag}
              onClick={() => handleTagToggle(tag)}
              $isSelected={selectedTags.includes(tag)}
            >
              {tag}
            </TagButton>
          ))}
          {(searchQuery || selectedTags.length > 0) && (
            <ClearButton
              onClick={handleClearFilters}
              title="Clear all filters"
            >
              <ClearIcon
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
              </ClearIcon>
            </ClearButton>
          )}
        </TagsContainer>
      </FilterContent>
    </FilterContainer>
  );
};

export default FilterBar;
