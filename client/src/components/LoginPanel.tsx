import React from 'react';
import styled from 'styled-components';
import { useAuth0 } from '@auth0/auth0-react';

const BlurredOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoginCard = styled.div`
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--space-8);
  max-width: 400px;
  width: 90%;
  text-align: center;
`;

const Title = styled.h2`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-4);
`;

const Subtitle = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-gray-600);
  margin-bottom: var(--space-6);
`;

const LoginButton = styled.button`
  background-color: var(--color-primary-600);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  width: 100%;

  &:hover {
    background-color: var(--color-primary-700);
  }

  &:disabled {
    background-color: var(--color-gray-400);
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-white);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  margin-right: var(--space-2);

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoginPanel: React.FC = () => {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect();
  };

  return (
    <BlurredOverlay>
      <LoginCard>
        <Title>Welcome to LilyTouille</Title>
        <Subtitle>
          Please sign in to access your personalized recipe collection and
          cooking experience.
        </Subtitle>
        <LoginButton onClick={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </LoginButton>
      </LoginCard>
    </BlurredOverlay>
  );
};

export default LoginPanel;
