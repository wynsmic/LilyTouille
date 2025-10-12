import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks';
import Layout from '../components/Layout';
import RecipeCard from '../components/RecipeCard';

const Container = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 var(--space-4);
  padding-top: var(--space-8);
  padding-bottom: var(--space-8);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-8);
`;

const Title = styled.h1`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-2);
`;

const Subtitle = styled.p`
  color: var(--color-gray-600);
  font-size: var(--font-size-lg);
`;

const BackButtonContainer = styled.div`
  margin-bottom: var(--space-6);
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  color: var(--color-primary-600);
  background: none;
  border: none;
  cursor: pointer;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-primary-800);
  }
`;

const BackIcon = styled.svg`
  width: 1.25rem;
  height: 1.25rem;
  margin-right: var(--space-2);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--space-12) 0;
`;

const EmptyIcon = styled.div`
  color: var(--color-gray-300);
  margin-bottom: var(--space-4);
`;

const EmptyIconSvg = styled.svg`
  width: 1.5rem;
  height: 1.5rem;
  margin: 0 auto;
`;

const EmptyTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-500);
  margin-bottom: var(--space-2);
`;

const EmptyText = styled.p`
  color: var(--color-gray-400);
  margin-bottom: var(--space-6);
`;

const BrowseButton = styled.button`
  background-color: var(--color-primary-500);
  color: var(--color-white);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  border: none;
  cursor: pointer;
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--color-primary-600);
  }
`;

const FavoritesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--space-6);

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { favoriteRecipes } = useRecipes();

  const handleRecipeClick = (recipeId: number) => {
    navigate(`/recipe/${recipeId}`);
  };

  return (
    <Layout>
      <Container>
        <Header>
          <Title>
            Your Favorite Recipes
          </Title>
          <Subtitle>
            {favoriteRecipes.length === 0
              ? "You haven't added any recipes to your favorites yet"
              : `You have ${favoriteRecipes.length} favorite recipe${favoriteRecipes.length === 1 ? '' : 's'}`}
          </Subtitle>
        </Header>

        <BackButtonContainer>
          <BackButton onClick={() => navigate('/')}>
            <BackIcon
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
            </BackIcon>
            Back to All Recipes
          </BackButton>
        </BackButtonContainer>

        {favoriteRecipes.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <EmptyIconSvg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </EmptyIconSvg>
            </EmptyIcon>
            <EmptyTitle>
              No favorites yet
            </EmptyTitle>
            <EmptyText>
              Start exploring recipes and add them to your favorites!
            </EmptyText>
            <BrowseButton onClick={() => navigate('/')}>
              Browse Recipes
            </BrowseButton>
          </EmptyState>
        ) : (
          <FavoritesGrid>
            {favoriteRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={handleRecipeClick}
              />
            ))}
          </FavoritesGrid>
        )}
      </Container>
    </Layout>
  );
};

export default FavoritesPage;
