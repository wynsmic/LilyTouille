import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRecipes } from '../hooks';
import { ScrapeRecipeModal, InventRecipeModal } from '.';

const FilterContainer = styled.div`
  background-color: var(--color-white);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-gray-100);
  margin-bottom: var(--space-8);
  position: relative;

  @media (max-width: 768px) {
    padding: var(--space-4);
  }
`;

const FilterContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-right: 12rem; /* Make space for AI buttons */

  @media (max-width: 768px) {
    padding-right: 0; /* Remove padding on mobile */
    gap: var(--space-4);
  }
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
  border: ${props => (props.$isSelected ? 'none' : '1px solid var(--color-gray-200)')};
  background-color: ${props => (props.$isSelected ? 'var(--color-primary-500)' : 'var(--color-gray-50)')};
  color: ${props => (props.$isSelected ? 'var(--color-white)' : 'var(--color-gray-600)')};

  &:hover {
    background-color: ${props => (props.$isSelected ? 'var(--color-primary-600)' : 'var(--color-gray-100)')};
    color: ${props => (props.$isSelected ? 'var(--color-white)' : 'var(--color-gray-800)')};
    border-color: ${props => (props.$isSelected ? 'none' : 'var(--color-gray-300)')};
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

const AIButtonsContainer = styled.div`
  position: absolute;
  top: 50%;
  right: var(--space-4);
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: 10;

  @media (max-width: 768px) {
    position: static;
    transform: none;
    flex-direction: row;
    justify-content: center;
    margin-top: var(--space-4);
    gap: var(--space-3);
  }
`;

const AIButton = styled.button<{ $variant: 'scrape' | 'invent' }>`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    flex: 1;
    justify-content: center;
    padding: var(--space-3);
    font-size: var(--font-size-xs);
  }

  ${props =>
    props.$variant === 'scrape' &&
    `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  `}

  ${props =>
    props.$variant === 'invent' &&
    `
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #ee82f0 0%, #f4475a 100%);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  `}
  
  &:active {
    transform: translateY(0);
  }
`;

const AIIcon = styled.div<{ $variant: 'scrape' | 'invent' }>`
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);

  ${props =>
    props.$variant === 'scrape' &&
    `
    background: rgba(255, 255, 255, 0.2);
  `}

  ${props =>
    props.$variant === 'invent' &&
    `
    background: rgba(255, 255, 255, 0.2);
  `}
`;

const ButtonText = styled.span`
  white-space: nowrap;
`;

const FilterBar: React.FC = () => {
  const { recipes, searchQuery, selectedTags, applyFilters, clearFilters } = useRecipes();

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Get all unique tags from recipes
  const allTags = Array.from(new Set(recipes.flatMap(recipe => recipe.tags))).sort();

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters(localSearchQuery, selectedTags);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, selectedTags, applyFilters]);

  const handleTagToggle = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag) ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag];

    applyFilters(searchQuery, newSelectedTags);
  };

  const handleClearFilters = () => {
    setLocalSearchQuery('');
    clearFilters();
  };

  const [isScrapeOpen, setIsScrapeOpen] = useState(false);
  const [isInventOpen, setIsInventOpen] = useState(false);

  const handleScrapeRecipe = () => {
    setIsScrapeOpen(true);
  };

  const handleInventRecipe = () => {
    setIsInventOpen(true);
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
            <TagButton key={tag} onClick={() => handleTagToggle(tag)} $isSelected={selectedTags.includes(tag)}>
              {tag}
            </TagButton>
          ))}
          {(searchQuery || selectedTags.length > 0) && (
            <ClearButton onClick={handleClearFilters} title="Clear all filters">
              <ClearIcon fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </ClearIcon>
            </ClearButton>
          )}
        </TagsContainer>
      </FilterContent>

      <AIButtonsContainer>
        <AIButton $variant="scrape" onClick={handleScrapeRecipe}>
          <AIIcon $variant="scrape">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </AIIcon>
          <ButtonText>
            <span className="desktop-text">Scrape Recipe</span>
            <span className="mobile-text">Scrape</span>
          </ButtonText>
        </AIButton>

        <AIButton $variant="invent" onClick={handleInventRecipe}>
          <AIIcon $variant="invent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </AIIcon>
          <ButtonText>
            <span className="desktop-text">Invent Recipe</span>
            <span className="mobile-text">Invent</span>
          </ButtonText>
        </AIButton>
      </AIButtonsContainer>

      <ScrapeRecipeModal open={isScrapeOpen} onClose={() => setIsScrapeOpen(false)} />
      <InventRecipeModal open={isInventOpen} onClose={() => setIsInventOpen(false)} />
    </FilterContainer>
  );
};

export default FilterBar;
