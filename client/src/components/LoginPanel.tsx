import React from 'react';
import styled from 'styled-components';
import { useAuth0 } from '@auth0/auth0-react';

const LoginContainer = styled.div`
  height: 100vh;
  background: linear-gradient(135deg, #fef7f0 0%, #fce7f3 50%, #f3e8ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 80%,
        rgba(251, 207, 232, 0.3) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(196, 181, 253, 0.3) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 40% 40%,
        rgba(254, 202, 202, 0.2) 0%,
        transparent 50%
      );
  }
`;

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: var(--space-8);
  border: 1px solid rgba(196, 181, 253, 0.3);
  max-width: 480px;
  width: 100%;
  position: relative;
  z-index: 1;
  box-shadow:
    0 8px 32px rgba(196, 181, 253, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);

  @media (max-width: 640px) {
    padding: var(--space-6);
    margin: var(--space-2);
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-6);
`;

const LogoImage = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 12px;
  margin-bottom: var(--space-3);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
`;

const AppName = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--space-2);
  letter-spacing: -0.02em;
`;

const Tagline = styled.p`
  font-size: var(--font-size-sm);
  color: rgba(120, 53, 15, 0.8);
  font-weight: 500;
  line-height: 1.4;
  max-width: 300px;
  margin: 0 auto;
`;

const FeaturesSection = styled.div`
  margin-bottom: var(--space-6);
`;

const FeatureList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
`;

const FeatureItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  transition: all 0.3s ease;
  border: 1px solid rgba(196, 181, 253, 0.2);

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(196, 181, 253, 0.2);
  }
`;

const FeatureIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: var(--space-2);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
`;

const FeatureContent = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: var(--space-2);
`;

const FeatureText = styled.div`
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: #92400e;
  line-height: 1.4;
  text-align: center;
`;

const LoginButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 16px;
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(217, 119, 6, 0.3);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.01em;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(217, 119, 6, 0.4);
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.6s;
  }

  &:hover::before {
    left: 100%;
  }
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoginPanel: React.FC = () => {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
      },
    });
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Header>
          <LogoImage src="/lilyTouille.png" alt="LilyTouille Logo" />
          <AppName>LilyTouille</AppName>
          <Tagline>Discover global tastes, cook local magic</Tagline>
        </Header>

        <FeaturesSection>
          <FeatureList>
            <FeatureItem>
              <FeatureIcon>🔍</FeatureIcon>
              <FeatureContent>
                <FeatureText>Find recipes from around the world</FeatureText>
              </FeatureContent>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>📄</FeatureIcon>
              <FeatureContent>
                <FeatureText>
                  Save recipes from any website instantly
                </FeatureText>
              </FeatureContent>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>✨</FeatureIcon>
              <FeatureContent>
                <FeatureText>Create new dishes with AI assistance</FeatureText>
              </FeatureContent>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>⭐</FeatureIcon>
              <FeatureContent>
                <FeatureText>Keep all your favorites in one place</FeatureText>
              </FeatureContent>
            </FeatureItem>
          </FeatureList>
        </FeaturesSection>

        <LoginButton onClick={handleLogin} disabled={isLoading}>
          {isLoading ? <LoadingSpinner /> : 'Start Cooking'}
        </LoginButton>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPanel;
