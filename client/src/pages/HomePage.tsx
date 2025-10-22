import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import FilterBar from '../components/FilterBar';
import RecipeList from '../components/RecipeList';

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

  @media (max-width: 768px) {
    display: none;
  }
`;

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleRecipeClick = (recipeId: number) => {
    navigate(`/recipe/${recipeId}`);
  };

  return (
    <Layout>
      <Container>
        <Header>
          <Title>Discover Amazing Recipes</Title>
          <Subtitle>
            Find your next favorite dish from around the world
          </Subtitle>
        </Header>

        <FilterBar />

        <RecipeList onRecipeClick={handleRecipeClick} />
      </Container>
    </Layout>
  );
};

export default HomePage;
