import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useScrapeMutation } from '../services/scrapeApi';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: var(--color-white);
  width: 90%;
  max-width: 520px;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  border: 1px solid var(--color-gray-100);
`;

const Header = styled.div`
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-gray-100);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
`;

const Content = styled.div`
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const Actions = styled.div`
  padding: var(--space-5) var(--space-6);
  border-top: 1px solid var(--color-gray-100);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
`;

const Input = styled.input`
  width: 100%;
  padding: var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  background: var(--color-white);
  color: var(--color-gray-900);
  &:focus {
    outline: none;
    box-shadow: 0 0 0 1px var(--color-primary-500);
    border-color: var(--color-primary-500);
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'ghost' }>`
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-semibold);
  border: ${p =>
    p.$variant === 'ghost' ? '1px solid var(--color-gray-200)' : 'none'};
  background: ${p =>
    p.$variant === 'ghost' ? 'transparent' : 'var(--color-primary-500)'};
  color: ${p => (p.$variant === 'ghost' ? 'var(--color-gray-800)' : 'white')};
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

type Props = {
  open: boolean;
  onClose: () => void;
};

const ScrapeRecipeModal: React.FC<Props> = ({ open, onClose }) => {
  const [url, setUrl] = useState('');
  const [scrape, { isLoading, isSuccess, data, error }] = useScrapeMutation();

  useEffect(() => {
    if (!open) {
      setUrl('');
    }
  }, [open]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    try {
      await scrape({ url }).unwrap();
    } catch {}
  };

  return (
    <Backdrop onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>Scrape recipe from URL</Header>
        <Content>
          <form onSubmit={onSubmit}>
            <Input
              type="url"
              placeholder="https://example.com/recipe"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
          </form>
          {isSuccess && data && (
            <div style={{ fontSize: '0.9rem', color: 'var(--color-gray-700)' }}>
              Saved as <strong>{data.filename}</strong>
            </div>
          )}
          {error && (
            <div style={{ color: 'var(--color-danger-600)' }}>
              Failed to scrape. Please try again.
            </div>
          )}
        </Content>
        <Actions>
          <Button $variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit as any} disabled={isLoading}>
            {isLoading ? 'Scraping…' : 'Scrape'}
          </Button>
        </Actions>
      </Modal>
    </Backdrop>
  );
};

export default ScrapeRecipeModal;
