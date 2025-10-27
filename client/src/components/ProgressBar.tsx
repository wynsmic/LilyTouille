import React from 'react';
import styled from 'styled-components';

interface ProgressBarProps {
  progress: number;
  stage: string;
  url?: string;
}

const ProgressContainer = styled.div`
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
  overflow: hidden;
`;

const ProgressHeader = styled.div`
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-gray-200);
`;

const ProgressTitle = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin: 0 0 var(--space-2) 0;
`;

const ProgressUrl = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  margin: 0;
  word-break: break-all;
`;

const ProgressBody = styled.div`
  padding: var(--space-4);
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 0.5rem;
  background-color: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-3);
`;

const ProgressBarFill = styled.div<{ progress: number; stage: string }>`
  height: 100%;
  width: ${props => props.progress}%;
  background-color: ${props => {
    switch (props.stage) {
      case 'queued':
        return 'var(--color-gray-400)';
      case 'scraping':
        return 'var(--color-blue-500)';
      case 'scraped':
        return 'var(--color-blue-600)';
      case 'ai_processing':
        return 'var(--color-purple-500)';
      case 'ai_processed':
        return 'var(--color-purple-600)';
      case 'stored':
        return 'var(--color-green-500)';
      case 'failed':
        return 'var(--color-red-500)';
      default:
        return 'var(--color-gray-400)';
    }
  }};
  transition:
    width 0.3s ease,
    background-color 0.3s ease;
`;

const ProgressStage = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
`;

const StageText = styled.span<{ stage: string }>`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: ${props => {
    switch (props.stage) {
      case 'queued':
        return 'var(--color-gray-600)';
      case 'scraping':
        return 'var(--color-blue-600)';
      case 'scraped':
        return 'var(--color-blue-700)';
      case 'ai_processing':
        return 'var(--color-purple-600)';
      case 'ai_processed':
        return 'var(--color-purple-700)';
      case 'stored':
        return 'var(--color-green-600)';
      case 'failed':
        return 'var(--color-red-600)';
      default:
        return 'var(--color-gray-600)';
    }
  }};
`;

const ProgressPercentage = styled.span`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-600);
`;

const ProgressTimeline = styled.div`
  margin-top: var(--space-3);
`;

const TimelineItem = styled.div<{ isActive: boolean; isCompleted: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: var(--space-2);
  opacity: ${props => (props.isActive || props.isCompleted ? 1 : 0.5)};
`;

const TimelineDot = styled.div<{
  isActive: boolean;
  isCompleted: boolean;
  stage: string;
}>`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: var(--radius-full);
  background-color: ${props => {
    if (props.isCompleted) return 'var(--color-green-500)';
    if (props.isActive) {
      switch (props.stage) {
        case 'queued':
          return 'var(--color-gray-400)';
        case 'scraping':
          return 'var(--color-blue-500)';
        case 'scraped':
          return 'var(--color-blue-600)';
        case 'ai_processing':
          return 'var(--color-purple-500)';
        case 'ai_processed':
          return 'var(--color-purple-600)';
        case 'stored':
          return 'var(--color-green-500)';
        case 'failed':
          return 'var(--color-red-500)';
        default:
          return 'var(--color-gray-400)';
      }
    }
    return 'var(--color-gray-300)';
  }};
  margin-right: var(--space-3);
  transition: background-color 0.3s ease;
`;

const TimelineText = styled.span<{ isActive: boolean; isCompleted: boolean }>`
  font-size: var(--font-size-sm);
  color: ${props => {
    if (props.isCompleted) return 'var(--color-green-600)';
    if (props.isActive) return 'var(--color-gray-900)';
    return 'var(--color-gray-500)';
  }};
  font-weight: ${props => (props.isActive ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)')};
`;

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, stage, url }) => {
  const getStageDisplayName = (stage: string) => {
    switch (stage) {
      case 'queued':
        return 'Queued';
      case 'scraping':
        return 'Scraping';
      case 'scraped':
        return 'Scraped';
      case 'ai_processing':
        return 'AI Processing';
      case 'ai_processed':
        return 'AI Processed';
      case 'stored':
        return 'Stored';
      case 'failed':
        return 'Failed';
      default:
        return stage;
    }
  };

  const stages = ['queued', 'scraping', 'scraped', 'ai_processing', 'ai_processed', 'stored'];
  const currentStageIndex = stages.indexOf(stage);
  const isFailed = stage === 'failed';

  return (
    <ProgressContainer>
      <ProgressHeader>
        <ProgressTitle>Scraping Progress</ProgressTitle>
        {url && <ProgressUrl>{url}</ProgressUrl>}
      </ProgressHeader>
      <ProgressBody>
        <ProgressStage>
          <StageText stage={stage}>{getStageDisplayName(stage)}</StageText>
          <ProgressPercentage>{Math.round(progress)}%</ProgressPercentage>
        </ProgressStage>

        <ProgressBarContainer>
          <ProgressBarFill progress={progress} stage={stage} />
        </ProgressBarContainer>

        <ProgressTimeline>
          {stages.map((stageName, index) => {
            const isActive = index === currentStageIndex && !isFailed;
            const isCompleted = index < currentStageIndex || (isFailed && index < currentStageIndex);

            return (
              <TimelineItem key={stageName} isActive={isActive} isCompleted={isCompleted}>
                <TimelineDot isActive={isActive} isCompleted={isCompleted} stage={stageName} />
                <TimelineText isActive={isActive} isCompleted={isCompleted}>
                  {getStageDisplayName(stageName)}
                </TimelineText>
              </TimelineItem>
            );
          })}
        </ProgressTimeline>
      </ProgressBody>
    </ProgressContainer>
  );
};

export default ProgressBar;
