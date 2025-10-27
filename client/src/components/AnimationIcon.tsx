import React from 'react';
import styled, { keyframes } from 'styled-components';

// Scraping animation - a spider web or crawling effect
const spiderCrawl = keyframes`
  0% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(10px) rotate(5deg); }
  50% { transform: translateX(20px) rotate(0deg); }
  75% { transform: translateX(10px) rotate(-5deg); }
  100% { transform: translateX(0) rotate(0deg); }
`;

const webPulse = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
`;

// AI processing animation - neural network or brain activity
const neuralPulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
`;

const dataFlow = keyframes`
  0% { transform: translateY(0); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(-20px); opacity: 0; }
`;

const ScrapingIcon = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  border-radius: 50%;
`;

const Spider = styled.div`
  width: 32px;
  height: 32px;
  background: var(--color-blue-500);
  border-radius: 50%;
  position: relative;
  animation: ${spiderCrawl} 2s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);

  &::before {
    content: '';
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 12px;
    background: var(--color-blue-500);
    border-radius: 2px;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 12px;
    background: var(--color-blue-500);
    border-radius: 2px;
  }
`;

const WebLines = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  animation: ${webPulse} 3s ease-in-out infinite;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 2px solid var(--color-blue-300);
    border-radius: 50%;
    animation: ${webPulse} 3s ease-in-out infinite;
  }

  &::before {
    width: 50px;
    height: 50px;
    animation-delay: 0.5s;
  }

  &::after {
    width: 25px;
    height: 25px;
    animation-delay: 1s;
  }
`;

const AIIcon = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
  border-radius: 50%;
`;

const BrainNode = styled.div<{ $delay?: number }>`
  width: 16px;
  height: 16px;
  background: var(--color-purple-500);
  border-radius: 50%;
  position: absolute;
  animation: ${neuralPulse} 2s ease-in-out infinite;
  animation-delay: ${props => props.$delay || 0}s;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
`;

const DataStream = styled.div<{ $delay?: number }>`
  position: absolute;
  width: 4px;
  height: 12px;
  background: var(--color-purple-400);
  border-radius: 2px;
  animation: ${dataFlow} 1.5s ease-in-out infinite;
  animation-delay: ${props => props.$delay || 0}s;
  box-shadow: 0 0 4px rgba(139, 92, 246, 0.6);
`;

const AIText = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: var(--color-purple-600);
  animation: ${neuralPulse} 2s ease-in-out infinite;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  text-shadow: 0 0 8px rgba(139, 92, 246, 0.3);
`;

type AnimationIconProps = {
  stage: 'scraping' | 'ai_processing';
  size?: number;
};

const AnimationIcon: React.FC<AnimationIconProps> = ({ stage, size = 40 }) => {
  if (stage === 'scraping') {
    return (
      <ScrapingIcon style={{ width: size, height: size }}>
        <WebLines />
        <Spider />
      </ScrapingIcon>
    );
  }

  if (stage === 'ai_processing') {
    return (
      <AIIcon style={{ width: size, height: size }}>
        {/* Neural network nodes */}
        <BrainNode style={{ top: '8px', left: '8px' }} />
        <BrainNode $delay={0.3} style={{ top: '12px', right: '8px' }} />
        <BrainNode $delay={0.6} style={{ bottom: '8px', left: '12px' }} />
        <BrainNode $delay={0.9} style={{ bottom: '12px', right: '12px' }} />

        {/* Data streams */}
        <DataStream $delay={0.2} style={{ top: '16px', left: '16px' }} />
        <DataStream $delay={0.5} style={{ top: '20px', right: '16px' }} />
        <DataStream $delay={0.8} style={{ bottom: '16px', left: '20px' }} />

        {/* AI text */}
        <AIText>AI</AIText>
      </AIIcon>
    );
  }

  return null;
};

export default AnimationIcon;
