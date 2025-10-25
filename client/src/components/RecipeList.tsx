import React from 'react';
import styled from 'styled-components';
import { useRecipes } from '../hooks';
import RecipeCard from './RecipeCard';

interface RecipeListProps {
  onRecipeClick: (recipeId: number) => void;
}

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 16rem;
`;

const Spinner = styled.div`
  animation: spin 1s linear infinite;
  border-radius: var(--radius-full);
  height: 3rem;
  width: 3rem;
  border-bottom: 2px solid var(--color-primary-500);

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: var(--space-12) 0;
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-2);
`;

const ErrorText = styled.p`
  color: var(--color-gray-600);
`;

const EmptyContainer = styled.div`
  text-align: center;
  padding: var(--space-12) 0;
`;

const EmptyMessage = styled.div`
  color: var(--color-gray-500);
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-2);
`;

const EmptyText = styled.p`
  color: var(--color-gray-400);
`;

const RecipeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--space-4);

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const RecipeList: React.FC<RecipeListProps> = ({ onRecipeClick }) => {
  const { filteredRecipes, isLoading, error } = useRecipes();

  if (isLoading) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <ErrorMessage>Error loading recipes</ErrorMessage>
        <ErrorText>{error}</ErrorText>
      </ErrorContainer>
    );
  }

  if (filteredRecipes.length === 0) {
    return (
      <EmptyContainer>
        <EmptyMessage>No recipes found</EmptyMessage>
        <EmptyText>Try adjusting your search criteria or filters</EmptyText>
      </EmptyContainer>
    );
  }

  return (
    <RecipeGrid>
      {filteredRecipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} onClick={onRecipeClick} />
      ))}
    </RecipeGrid>
  );
};

export default RecipeList;
