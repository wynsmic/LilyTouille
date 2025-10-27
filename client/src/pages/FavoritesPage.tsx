import React from 'react';
import styled from 'styled-components';
import { useUser } from '../contexts/useUser';
import RecipeCard from '../components/RecipeCard';
import Layout from '../components/Layout';

const FavoritesContainer = styled.div`
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: var(--space-8);
  text-align: center;
`;

const PageTitle = styled.h1`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-2);
`;

const PageSubtitle = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-gray-600);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--space-12) var(--space-6);
  color: var(--color-gray-500);
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: var(--space-4);
`;

const EmptyStateTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
  color: var(--color-gray-700);
`;

const EmptyStateText = styled.p`
  font-size: var(--font-size-base);
  max-width: 400px;
  margin: 0 auto;
`;

const RecipesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-6);
  margin-top: var(--space-6);
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-12);
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-gray-200);
  border-top: 4px solid var(--color-primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const FavoritesPage: React.FC = () => {
  const { favorites, favoritesLoading } = useUser();

  if (favoritesLoading) {
    return (
      <Layout>
        <FavoritesContainer>
          <LoadingContainer>
            <LoadingSpinner />
          </LoadingContainer>
        </FavoritesContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <FavoritesContainer>
        <PageHeader>
          <PageTitle>My Favorite Recipes</PageTitle>
          <PageSubtitle>
            {favorites.length === 0
              ? 'Start adding recipes to your favorites to see them here'
              : `You have ${favorites.length} favorite recipe${favorites.length === 1 ? '' : 's'}`}
          </PageSubtitle>
        </PageHeader>

        {favorites.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>⭐</EmptyStateIcon>
            <EmptyStateTitle>No favorites yet</EmptyStateTitle>
            <EmptyStateText>
              Browse recipes and click the heart icon to add them to your favorites. They'll appear here for easy
              access.
            </EmptyStateText>
          </EmptyState>
        ) : (
          <RecipesGrid>
            {favorites.map(favorite => (
              <RecipeCard key={favorite.id} recipe={favorite.recipe!} showFavoriteButton={true} />
            ))}
          </RecipesGrid>
        )}
      </FavoritesContainer>
    </Layout>
  );
};

export default FavoritesPage;
