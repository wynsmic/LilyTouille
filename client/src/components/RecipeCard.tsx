import React from 'react';
import styled from 'styled-components';
import { Recipe } from '../services/api';
import { useUserFavorites } from '../hooks/useUserFavorites';
import { Favorite, FavoriteBorder, Delete } from '@mui/icons-material';

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: (recipeId: number) => void;
  showFavoriteButton?: boolean;
  showDeleteButton?: boolean;
  onDelete?: (recipeId: number) => void;
}

const Card = styled.div`
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  position: relative;
  transition: all var(--transition-normal);
  height: 120px;

  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
`;

const ButtonsContainer = styled.div`
  width: 40px;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) 0;
  background: rgba(0, 0, 0, 0.02);
`;

const ActionButton = styled.button<{ $isFavorite?: boolean }>`
  transition: all var(--transition-fast);
  background: rgba(255, 255, 255, 0.8);
  border: none;
  padding: var(--space-1);
  margin: 0;
  outline: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  text-align: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  color: ${(props: { $isFavorite?: boolean }) => (props.$isFavorite ? '#ef4444' : 'var(--color-gray-600)')};
  box-shadow: var(--shadow-sm);

  &:hover {
    background: rgba(255, 255, 255, 1);
    color: ${(props: { $isFavorite?: boolean }) => (props.$isFavorite ? '#dc2626' : '#ef4444')};
    transform: scale(1.1);
    box-shadow: var(--shadow-md);
  }
`;

const DeleteButton = styled(ActionButton)`
  opacity: 0;

  ${Card}:hover & {
    opacity: 1;
  }

  @media (max-width: 768px) {
    opacity: 1;
  }
`;

const ContentSection = styled.div`
  flex: 1;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const ImageSection = styled.div`
  width: 120px;
  height: 100%;
  flex-shrink: 0;
  overflow: hidden;
`;

const RecipeImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);

  ${Card}:hover & {
    transform: scale(1.05);
  }
`;

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Title = styled.h3`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin: 0;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetadataRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-gray-600);
`;

const MetadataItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: var(--font-weight-medium);
`;

const Description = styled.p`
  color: var(--color-gray-600);
  font-size: var(--font-size-xs);
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: auto;
  max-height: 20px;
  overflow: hidden;
`;

const Tag = styled.span`
  padding: 2px var(--space-1);
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
  font-size: 10px;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-medium);
  line-height: 1;
`;

const MoreTags = styled.span`
  padding: 2px var(--space-1);
  background-color: var(--color-gray-100);
  color: var(--color-gray-600);
  font-size: 10px;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-medium);
  line-height: 1;
`;

const DifficultyBadge = styled.span<{ $difficulty: string }>`
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
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

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onClick,
  showFavoriteButton = true,
  showDeleteButton = false,
  onDelete,
}) => {
  const { toggleFavorite, isFavorite } = useUserFavorites();
  const isRecipeFavorite = isFavorite(recipe.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking favorite button
    toggleFavorite(recipe.id);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking delete button

    if (window.confirm(`Are you sure you want to delete "${recipe.title}"? This action cannot be undone.`)) {
      onDelete?.(recipe.id);
    }
  };

  const handleCardClick = () => {
    onClick?.(recipe.id);
  };

  return (
    <Card onClick={handleCardClick}>
      <ButtonsContainer>
        {showFavoriteButton && (
          <ActionButton
            onClick={handleFavoriteClick}
            $isFavorite={isRecipeFavorite}
            aria-label={isRecipeFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isRecipeFavorite ? (
              <Favorite style={{ width: '16px', height: '16px' }} />
            ) : (
              <FavoriteBorder style={{ width: '16px', height: '16px' }} />
            )}
          </ActionButton>
        )}

        {showDeleteButton && (
          <DeleteButton onClick={handleDeleteClick} aria-label="Delete recipe">
            <Delete style={{ width: '16px', height: '16px' }} />
          </DeleteButton>
        )}
      </ButtonsContainer>

      <ContentSection>
        <HeaderSection>
          <Title>{recipe.title}</Title>
          <MetadataRow>
            <MetadataItem>
              <span>{recipe.totalPrepTime + recipe.totalCookTime} min</span>
            </MetadataItem>
            <MetadataItem>
              <DifficultyBadge $difficulty={recipe.difficulty}>{recipe.difficulty}</DifficultyBadge>
            </MetadataItem>
            <MetadataItem>
              <span>{recipe.servings} servings</span>
            </MetadataItem>
          </MetadataRow>
        </HeaderSection>

        <Description>{recipe.description}</Description>

        <TagsContainer>
          {recipe.tags.slice(0, 2).map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          {recipe.tags.length > 2 && <MoreTags>+{recipe.tags.length - 2}</MoreTags>}
        </TagsContainer>
      </ContentSection>

      <ImageSection>
        <RecipeImage src={recipe.imageUrl} alt={recipe.title} />
      </ImageSection>
    </Card>
  );
};

export default RecipeCard;
