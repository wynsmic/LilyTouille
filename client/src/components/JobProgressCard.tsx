import React from 'react';
import styled from 'styled-components';
import { Job } from '../store/scrapeProgressSlice';

interface JobProgressCardProps {
  job: Job;
  onRetry?: (jobId: string) => void;
}

const Card = styled.div<{ status: string }>`
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid
    ${props => {
      switch (props.status) {
        case 'completed':
          return 'var(--color-green-200)';
        case 'failed':
          return 'var(--color-red-200)';
        case 'in_progress':
          return 'var(--color-blue-200)';
        default:
          return 'var(--color-gray-200)';
      }
    }};
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: var(--shadow-md);
  }
`;

const CardHeader = styled.div<{ status: string }>`
  padding: var(--space-4);
  border-bottom: 1px solid
    ${props => {
      switch (props.status) {
        case 'completed':
          return 'var(--color-green-200)';
        case 'failed':
          return 'var(--color-red-200)';
        case 'in_progress':
          return 'var(--color-blue-200)';
        default:
          return 'var(--color-gray-200)';
      }
    }};
  background-color: ${props => {
    switch (props.status) {
      case 'completed':
        return 'var(--color-green-50)';
      case 'failed':
        return 'var(--color-red-50)';
      case 'in_progress':
        return 'var(--color-blue-50)';
      default:
        return 'var(--color-gray-50)';
    }
  }};
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  background-color: ${props => {
    switch (props.status) {
      case 'completed':
        return 'var(--color-green-100)';
      case 'failed':
        return 'var(--color-red-100)';
      case 'in_progress':
        return 'var(--color-blue-100)';
      default:
        return 'var(--color-gray-100)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'completed':
        return 'var(--color-green-700)';
      case 'failed':
        return 'var(--color-red-700)';
      case 'in_progress':
        return 'var(--color-blue-700)';
      default:
        return 'var(--color-gray-700)';
    }
  }};
`;

const UrlText = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  margin: var(--space-2) 0 0 0;
  word-break: break-all;
`;

const CardBody = styled.div`
  padding: var(--space-4);
`;

const ProgressContainer = styled.div`
  margin-bottom: var(--space-3);
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 0.5rem;
  background-color: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-2);
`;

const ProgressBarFill = styled.div<{ progress: number; status: string }>`
  height: 100%;
  width: ${props => props.progress}%;
  background-color: ${props => {
    switch (props.status) {
      case 'completed':
        return 'var(--color-green-500)';
      case 'failed':
        return 'var(--color-red-500)';
      case 'in_progress':
        return 'var(--color-blue-500)';
      default:
        return 'var(--color-gray-400)';
    }
  }};
  transition:
    width 0.3s ease,
    background-color 0.3s ease;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
`;

const Timeline = styled.div`
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
  status: string;
}>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--radius-full);
  background-color: ${props => {
    if (props.isCompleted) return 'var(--color-green-500)';
    if (props.isActive) {
      switch (props.status) {
        case 'completed':
          return 'var(--color-green-500)';
        case 'failed':
          return 'var(--color-red-500)';
        case 'in_progress':
          return 'var(--color-blue-500)';
        default:
          return 'var(--color-gray-400)';
      }
    }
    return 'var(--color-gray-300)';
  }};
  margin-right: var(--space-2);
`;

const TimelineText = styled.span<{ isActive: boolean; isCompleted: boolean }>`
  font-size: var(--font-size-xs);
  color: ${props => {
    if (props.isCompleted) return 'var(--color-green-600)';
    if (props.isActive) return 'var(--color-gray-900)';
    return 'var(--color-gray-500)';
  }};
`;

const CardFooter = styled.div`
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-50);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Timestamp = styled.span`
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
`;

const RetryButton = styled.button`
  background-color: var(--color-blue-600);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--color-blue-700);
  }

  &:disabled {
    background-color: var(--color-gray-400);
    cursor: not-allowed;
  }
`;

const JobProgressCard: React.FC<JobProgressCardProps> = ({ job, onRetry }) => {
  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getCurrentStage = () => {
    if (job.progress.length === 0) return 'queued';
    const latestProgress = job.progress[job.progress.length - 1];
    return latestProgress.stage;
  };

  const getProgressPercentage = () => {
    const stages = [
      'queued',
      'scraping',
      'scraped',
      'ai_processing',
      'ai_processed',
      'stored',
    ];
    const currentStage = getCurrentStage();
    const stageIndex = stages.indexOf(currentStage);

    if (stageIndex === -1) return 0;
    return Math.round((stageIndex / (stages.length - 1)) * 100);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const stages = [
    'queued',
    'scraping',
    'scraped',
    'ai_processing',
    'ai_processed',
    'stored',
  ];
  const currentStage = getCurrentStage();
  const currentStageIndex = stages.indexOf(currentStage);
  const progress = getProgressPercentage();

  return (
    <Card status={job.status}>
      <CardHeader status={job.status}>
        <StatusBadge status={job.status}>
          {getStatusDisplayName(job.status)}
        </StatusBadge>
        <UrlText>
          {job.type === 'invent' ? job.title || 'Recipe Invention' : job.url}
        </UrlText>
      </CardHeader>

      <CardBody>
        <ProgressContainer>
          <ProgressBarContainer>
            <ProgressBarFill progress={progress} status={job.status} />
          </ProgressBarContainer>
          <ProgressText>
            <span>{currentStage.replace('_', ' ').toUpperCase()}</span>
            <span>{progress}%</span>
          </ProgressText>
        </ProgressContainer>

        <Timeline>
          {stages.map((stage, index) => {
            const isActive =
              index === currentStageIndex && job.status === 'in_progress';
            const isCompleted =
              index < currentStageIndex || job.status === 'completed';

            return (
              <TimelineItem
                key={stage}
                isActive={isActive}
                isCompleted={isCompleted}
              >
                <TimelineDot
                  isActive={isActive}
                  isCompleted={isCompleted}
                  status={job.status}
                />
                <TimelineText isActive={isActive} isCompleted={isCompleted}>
                  {stage.replace('_', ' ').toUpperCase()}
                </TimelineText>
              </TimelineItem>
            );
          })}
        </Timeline>
      </CardBody>

      <CardFooter>
        <Timestamp>Started: {formatTimestamp(job.createdAt)}</Timestamp>
        {job.status === 'failed' && onRetry && (
          <RetryButton onClick={() => onRetry(job.id)}>Retry</RetryButton>
        )}
      </CardFooter>
    </Card>
  );
};

export default JobProgressCard;
