import React from 'react';
import styled from 'styled-components';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  z-index: 1000;
  padding: 24px;
`;

const Modal = styled.div`
  background: white;
  width: 100%;
  max-width: 380px;
  max-height: 85vh;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 18px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: left;
  position: relative;
`;

const HeaderTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px 0;
`;

const HeaderSubtitle = styled.p`
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
`;

const Content = styled.div`
  padding: 16px 20px;
`;

const Message = styled.div`
  padding: 12px;
  background: #fff9e6;
  border: 1px solid #fde68a;
  border-radius: 12px;
  color: #92400e;
  font-size: 13px;
  text-align: left;
  margin-bottom: 16px;
`;

// Removed detailed preview; modal now only shows a short purpose message and actions

const Actions = styled.div`
  padding: 14px 16px 16px 16px;
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

interface RecipeValidationModalProps {
  open: boolean;
  recipe: { id: number; title: string; description: string; imageUrl?: string };
  onValidate: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onRetry: () => void;
  isLoading?: boolean;
}

const RecipeValidationModal: React.FC<RecipeValidationModalProps> = ({
  open,
  recipe,
  onValidate,
  onCancel,
  onDelete,
  onRetry,
  isLoading = false,
}) => {
  if (!open || !recipe) return null;

  return (
    <Backdrop onClick={onCancel}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <HeaderTitle>✋ Validate Your Recipe</HeaderTitle>
          <HeaderSubtitle>Confirm your recipe is ready, or delete/retry.</HeaderSubtitle>
        </Header>
        <Content>
          <Message>
            <div style={{ fontWeight: '600' }}>This recipe needs your validation</div>
          </Message>
        </Content>
        <Actions>
          <Button $variant="ghost" onClick={onRetry} disabled={isLoading}>
            🔄 Retry
          </Button>
          <Button $variant="ghost" onClick={onDelete} disabled={isLoading}>
            Delete
          </Button>
          <Button $variant="primary" onClick={onValidate} disabled={isLoading}>
            Validate
          </Button>
        </Actions>
      </Modal>
    </Backdrop>
  );
};

export default RecipeValidationModal;
