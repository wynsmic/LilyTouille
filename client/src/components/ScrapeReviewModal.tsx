import React from 'react';
import styled from 'styled-components';
import { Recipe } from '../services/api';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
`;

const Modal = styled.div`
  background: white;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.3;
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 20px;
  transition: all 0.2s ease;
  z-index: 1;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const HeaderContent = styled.div`
  flex: 1;
  position: relative;
  z-index: 1;
`;

const Spacer = styled.div`
  width: 32px;
`;

const Content = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;
`;

const RecipePreview = styled.div`
  border: 1px solid var(--color-gray-200);
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-gray-50);
`;

const RecipeImage = styled.img`
  width: 100%;
  max-height: 200px;
  object-fit: cover;
`;

const RecipeInfo = styled.div`
  padding: 16px;
`;

const RecipeTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 8px 0;
`;

const RecipeDescription = styled.p`
  font-size: 14px;
  color: var(--color-gray-600);
  margin: 0 0 12px 0;
  line-height: 1.5;
`;

const RecipeMeta = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--color-gray-500);
  margin-bottom: 12px;
`;

const RecipeMetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const IngredientsList = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
`;

const IngredientsTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 12px 0;
`;

const IngredientList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
`;

const IngredientItem = styled.li`
  font-size: 13px;
  color: var(--color-gray-700);
  padding-left: 20px;
  position: relative;

  &::before {
    content: '•';
    position: absolute;
    left: 0;
    color: var(--color-primary-500);
    font-weight: bold;
  }
`;

const Actions = styled.div`
  padding: 24px;
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'ghost' }>`
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
          }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
          }
        `;
      case 'ghost':
      default:
        return `
          background: transparent;
          color: #64748b;
          border: 2px solid #e2e8f0;
          &:hover:not(:disabled) {
            background: #f8fafc;
            color: #374151;
            border-color: #cbd5e1;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  &:active {
    transform: translateY(0);
  }
`;

const Message = styled.div`
  padding: 16px;
  background: #fff9e6;
  border: 1px solid #fde68a;
  border-radius: 12px;
  color: #92400e;
  font-size: 14px;
  text-align: center;
  margin-bottom: 16px;
`;

interface ScrapeReviewModalProps {
  open: boolean;
  recipe: Recipe | null;
  onAccept: () => void;
  onRetry: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ScrapeReviewModal: React.FC<ScrapeReviewModalProps> = ({
  open,
  recipe,
  onAccept,
  onRetry,
  onCancel,
  isLoading = false,
}) => {
  if (!open || !recipe) return null;

  const firstChunk = recipe.chunks?.[0];
  const firstIngredients = firstChunk?.ingredients || [];

  return (
    <Backdrop>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Spacer />
          <HeaderContent>
            <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>👀 Review Scraped Recipe</div>
            <div style={{ fontSize: '16px', opacity: 0.9 }}>Is this result satisfactory?</div>
          </HeaderContent>
          <CloseButton onClick={onCancel} disabled={isLoading} title="Cancel and delete">
            ×
          </CloseButton>
        </Header>
        <Content>
          <Message>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Please review the scraped recipe</div>
            <div style={{ fontSize: '13px' }}>Check if the content, ingredients, and formatting look correct</div>
          </Message>

          <RecipePreview>
            {recipe.imageUrl && (
              <RecipeImage
                src={recipe.imageUrl}
                alt={recipe.title}
                onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            )}
            <RecipeInfo>
              <RecipeTitle>{recipe.title}</RecipeTitle>
              <RecipeDescription>{recipe.description}</RecipeDescription>
              <RecipeMeta>
                {recipe.totalPrepTime > 0 && <RecipeMetaItem>⏱️ {recipe.totalPrepTime} min prep</RecipeMetaItem>}
                {recipe.totalCookTime > 0 && <RecipeMetaItem>🔥 {recipe.totalCookTime} min cook</RecipeMetaItem>}
                {recipe.servings > 0 && <RecipeMetaItem>👥 {recipe.servings} servings</RecipeMetaItem>}
                {recipe.difficulty && (
                  <RecipeMetaItem>
                    {recipe.difficulty === 'easy' && '😊'}
                    {recipe.difficulty === 'medium' && '🤔'}
                    {recipe.difficulty === 'hard' && '🔥'}
                    {recipe.difficulty}
                  </RecipeMetaItem>
                )}
              </RecipeMeta>
            </RecipeInfo>
          </RecipePreview>

          {firstIngredients.length > 0 && (
            <IngredientsList>
              <IngredientsTitle>First chunk ingredients preview:</IngredientsTitle>
              <IngredientList>
                {firstIngredients.slice(0, 8).map((ingredient, index) => (
                  <IngredientItem key={index}>{ingredient}</IngredientItem>
                ))}
                {firstIngredients.length > 8 && (
                  <IngredientItem style={{ fontStyle: 'italic', color: 'var(--color-gray-500)' }}>
                    + {firstIngredients.length - 8} more ingredients...
                  </IngredientItem>
                )}
              </IngredientList>
            </IngredientsList>
          )}
        </Content>
        <Actions>
          <Button $variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel & Delete
          </Button>
          <Button $variant="danger" onClick={onRetry} disabled={isLoading}>
            🔄 Retry Scraping
          </Button>
          <Button $variant="primary" onClick={onAccept} disabled={isLoading}>
            ✓ Looks Good!
          </Button>
        </Actions>
      </Modal>
    </Backdrop>
  );
};

export default ScrapeReviewModal;
