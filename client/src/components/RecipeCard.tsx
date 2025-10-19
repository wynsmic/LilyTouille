import React from 'react';
import styled from 'styled-components';
import { Recipe } from '../services/api';
import { useRecipes } from '../hooks';
import { Favorite, FavoriteBorder, Delete } from '@mui/icons-material';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: (recipeId: number) => void;
}

const Card = styled.div`
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  position: relative;
  transition: box-shadow var(--transition-normal);

  &:hover {
    box-shadow: var(--shadow-lg);
  }
`;

const FavoriteButton = styled.button<{ $isFavorite: boolean }>`
  transition: color var(--transition-fast);
  z-index: 10;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  outline: none;
  flex: 0 0 auto;
  width: 32px;
  margin-right: var(--space-2);
  text-align: center;
  cursor: pointer;
  color: ${(props: { $isFavorite: boolean }) =>
    props.$isFavorite ? '#ef4444' : 'var(--color-gray-400)'};

  &:hover {
    color: ${(props: { $isFavorite: boolean }) =>
      props.$isFavorite ? '#dc2626' : '#ef4444'};
  }
`;

const DeleteButton = styled.button`
  transition:
    color var(--transition-fast),
    opacity var(--transition-fast);
  z-index: 10;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  outline: none;
  flex: 0 0 auto;
  width: 32px;
  margin-left: var(--space-2);
  text-align: center;
  cursor: pointer;
  color: var(--color-gray-400);
  opacity: 0;

  ${Card}:hover & {
    opacity: 1;
  }

  &:hover {
    color: #ef4444;
  }
`;

const ContentSection = styled.div`
  flex: 1 1 auto;
  padding-right: var(--space-1);
  padding-left: var(--space-8);
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-2);
`;

const Title = styled.h3`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  flex: 1;
  margin-right: var(--space-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DifficultyBadge = styled.span<{ $difficulty: string }>`
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
  background-color: ${(props: { $difficulty: string }) =>
    props.$difficulty === 'easy'
      ? 'var(--color-green-100)'
      : props.$difficulty === 'medium'
        ? 'var(--color-yellow-100)'
        : 'var(--color-red-100)'};
  color: ${(props: { $difficulty: string }) =>
    props.$difficulty === 'easy'
      ? 'var(--color-green-800)'
      : props.$difficulty === 'medium'
        ? 'var(--color-yellow-800)'
        : 'var(--color-red-800)'};
`;

const Description = styled.p`
  color: var(--color-gray-600);
  font-size: var(--font-size-xs);
  margin-bottom: var(--space-2);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
`;

const Tag = styled.span`
  padding: var(--space-1) var(--space-2);
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
  font-size: var(--font-size-xs);
  border-radius: var(--radius-full);
`;

const MoreTags = styled.span`
  padding: var(--space-1) var(--space-2);
  background-color: var(--color-gray-100);
  color: var(--color-gray-600);
  font-size: var(--font-size-xs);
  border-radius: var(--radius-full);
`;

const MetaInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
`;

const ImageContainer = styled.div`
  width: 4rem;
  height: 4rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
`;

const RecipeImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: 64px;
  max-height: 64px;
  min-width: 64px;
  min-height: 64px;
`;

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const { toggleFavoriteRecipe, isFavorite, deleteRecipeById } = useRecipes();
  const isRecipeFavorite = isFavorite(recipe.id.toString());

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking favorite button
    toggleFavoriteRecipe(recipe.id.toString());
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking delete button

    if (
      window.confirm(
        `Are you sure you want to delete "${recipe.title}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteRecipeById(recipe.id);
      } catch (error) {
        alert('Failed to delete recipe. Please try again.');
      }
    }
  };

  return (
    <Card onClick={() => onClick(recipe.id)}>
      <FavoriteButton
        onClick={handleFavoriteClick}
        $isFavorite={isRecipeFavorite}
        aria-label={
          isRecipeFavorite ? 'Remove from favorites' : 'Add to favorites'
        }
      >
        {isRecipeFavorite ? (
          <Favorite style={{ width: '16px', height: '16px' }} />
        ) : (
          <FavoriteBorder style={{ width: '16px', height: '16px' }} />
        )}
      </FavoriteButton>

      <ContentSection>
        <HeaderRow>
          <Title>{recipe.title}</Title>
          <DifficultyBadge $difficulty={recipe.difficulty}>
            {recipe.difficulty}
          </DifficultyBadge>
        </HeaderRow>

        <Description>{recipe.description}</Description>

        <TagsContainer>
          {recipe.tags.slice(0, 2).map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          {recipe.tags.length > 2 && (
            <MoreTags>+{recipe.tags.length - 2}</MoreTags>
          )}
        </TagsContainer>

        <MetaInfo>
          <span>{recipe.prepTime + recipe.cookTime} min</span>
          <span>{recipe.servings} servings</span>
        </MetaInfo>
      </ContentSection>

      <ImageContainer>
        <RecipeImage src={recipe.imageUrl} alt={recipe.title} />
      </ImageContainer>

      <DeleteButton onClick={handleDeleteClick} aria-label="Delete recipe">
        <Delete style={{ width: '16px', height: '16px' }} />
      </DeleteButton>
    </Card>
  );
};

export default RecipeCard;
