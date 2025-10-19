import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useScrapeProgress } from '../hooks/useScrapeProgress';
import AnimationIcon from './AnimationIcon';

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

const Input = styled.input<{ $disabled?: boolean }>`
  width: 100%;
  padding: var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  background: ${props =>
    props.$disabled ? 'var(--color-gray-100)' : 'var(--color-white)'};
  color: ${props =>
    props.$disabled ? 'var(--color-gray-500)' : 'var(--color-gray-900)'};
  cursor: ${props => (props.$disabled ? 'not-allowed' : 'text')};
  &:focus {
    outline: none;
    box-shadow: 0 0 0 1px var(--color-primary-500);
    border-color: var(--color-primary-500);
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'ghost' | 'retry' }>`
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-semibold);
  border: ${p => {
    if (p.$variant === 'ghost') return '1px solid var(--color-gray-200)';
    if (p.$variant === 'retry') return '1px solid var(--color-red-200)';
    return 'none';
  }};
  background: ${p => {
    if (p.$variant === 'ghost') return 'transparent';
    if (p.$variant === 'retry') return 'var(--color-red-50)';
    return 'var(--color-primary-500)';
  }};
  color: ${p => {
    if (p.$variant === 'ghost') return 'var(--color-gray-800)';
    if (p.$variant === 'retry') return 'var(--color-red-700)';
    return 'white';
  }};
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  padding: var(--space-3);
  background-color: var(--color-red-50);
  border: 1px solid var(--color-red-200);
  border-radius: var(--radius-md);
  color: var(--color-red-700);
  font-size: var(--font-size-sm);
`;

const SuccessMessage = styled.div`
  padding: var(--space-3);
  background-color: var(--color-green-50);
  border: 1px solid var(--color-green-200);
  border-radius: var(--radius-md);
  color: var(--color-green-700);
  font-size: var(--font-size-sm);
`;

const ProgressSection = styled.div`
  margin-top: var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
`;

const ProgressAnimation = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
`;

const ProgressStatus = styled.div<{ $stage: string }>`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: ${props => {
    switch (props.$stage) {
      case 'queued':
        return 'var(--color-gray-500)';
      case 'scraping':
        return 'var(--color-blue-600)';
      case 'scraped':
        return 'var(--color-purple-600)';
      case 'ai_processing':
        return 'var(--color-purple-600)';
      case 'ai_processed':
        return 'var(--color-purple-700)';
      case 'stored':
        return 'var(--color-green-600)';
      case 'failed':
        return 'var(--color-red-600)';
      default:
        return 'var(--color-gray-500)';
    }
  }};
  text-align: center;
`;

type Props = {
  open: boolean;
  onClose: () => void;
};

const ScrapeRecipeModal: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const getCurrentStep = (currentProgress: any) => {
    if (!currentProgress) return null;

    // Map of stages to their "next" or "current" step
    const stageToCurrentStep: Record<string, string> = {
      queued: 'Scraping',
      scraping: 'Scraping',
      scraped: 'AI Processing',
      ai_processing: 'AI Processing',
      ai_processed: 'Storing',
      stored: 'Completed',
      failed: 'Failed',
    };

    return stageToCurrentStep[currentProgress.stage] || currentProgress.stage;
  };

  const { triggerScrape, activeJobs, completedJobs, failedJobs } =
    useScrapeProgress();

  // Get current job details
  const currentJob = currentJobId
    ? activeJobs.find(job => job.id === currentJobId) ||
      completedJobs.find(job => job.id === currentJobId) ||
      failedJobs.find(job => job.id === currentJobId)
    : null;

  // Get current progress from the job's progress array
  const currentProgress = currentJob
    ? currentJob.progress[currentJob.progress.length - 1]
    : null;

  const isScraping =
    currentProgress &&
    currentProgress.stage !== 'stored' &&
    currentProgress.stage !== 'failed';
  const isCompleted = currentProgress && currentProgress.stage === 'stored';
  const isFailed = currentProgress && currentProgress.stage === 'failed';

  useEffect(() => {
    if (!open) {
      // Only reset if not in a failed state and not explicitly cancelled by user
      // The handleClose function will handle resetting when user clicks Cancel
      if (!isFailed) {
        setUrl('');
        setCurrentJobId(null);
        setError(null);
        setIsSuccess(false);
      }
    }
  }, [open, isFailed]);

  // Handle successful completion
  useEffect(() => {
    if (isCompleted && currentProgress?.recipeId) {
      setIsSuccess(true);
      // Close modal and navigate to recipe after a short delay
      setTimeout(() => {
        onClose();
        navigate(`/recipe/${currentProgress.recipeId}`);
      }, 2000);
    }
  }, [isCompleted, currentProgress, navigate, onClose]);

  // Handle failure
  useEffect(() => {
    if (isFailed) {
      setError('Scraping failed. Please try again with a different URL.');
    }
  }, [isFailed]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setIsSuccess(false);

    const result = await triggerScrape(url.trim());

    if (result.success && result.jobId) {
      setCurrentJobId(result.jobId);
    } else {
      setError(result.error || 'Failed to start scraping');
    }
  };

  const handleRetry = async () => {
    if (!url.trim()) return;

    setError(null);
    setIsSuccess(false);

    const result = await triggerScrape(url.trim());

    if (result.success && result.jobId) {
      setCurrentJobId(result.jobId);
    } else {
      setError(result.error || 'Failed to retry scraping');
    }
  };

  const handleClose = () => {
    if (!isScraping) {
      // Reset all state when user explicitly cancels
      setUrl('');
      setCurrentJobId(null);
      setError(null);
      setIsSuccess(false);
      onClose();
    }
  };

  return (
    <Backdrop onClick={handleClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>Scrape recipe from URL</Header>
        <Content>
          <form onSubmit={onSubmit}>
            <Input
              type="url"
              placeholder="https://example.com/recipe"
              value={isScraping && currentProgress ? currentProgress.url : url}
              onChange={e => setUrl(e.target.value)}
              disabled={!!isScraping}
              $disabled={!!isScraping}
              required
            />
          </form>

          {isSuccess && (
            <SuccessMessage>
              ✅ Recipe scraped successfully! Redirecting to the new recipe...
            </SuccessMessage>
          )}

          {error && <ErrorMessage>❌ {error}</ErrorMessage>}

          {currentProgress && (
            <ProgressSection>
              {(currentProgress.stage === 'scraping' ||
                currentProgress.stage === 'scraped') && (
                <ProgressAnimation>
                  <AnimationIcon
                    stage={
                      currentProgress.stage === 'scraping'
                        ? 'scraping'
                        : 'ai_processing'
                    }
                    size={64}
                  />
                </ProgressAnimation>
              )}
              <ProgressStatus $stage={currentProgress.stage}>
                {getCurrentStep(currentProgress)}
              </ProgressStatus>
            </ProgressSection>
          )}
        </Content>
        <Actions>
          <Button
            $variant="ghost"
            onClick={handleClose}
            disabled={!!isScraping}
          >
            {isScraping ? 'Scraping...' : 'Cancel'}
          </Button>
          {isFailed ? (
            <Button $variant="retry" onClick={handleRetry}>
              Retry
            </Button>
          ) : (
            <Button
              onClick={onSubmit as any}
              disabled={isScraping || !url.trim()}
            >
              {isScraping ? 'Scraping...' : 'Scrape'}
            </Button>
          )}
        </Actions>
      </Modal>
    </Backdrop>
  );
};

export default ScrapeRecipeModal;
