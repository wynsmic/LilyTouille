import React, { useState } from 'react';
import styled from 'styled-components';
import { useScrapeProgress } from '../hooks/useScrapeProgress';
import JobProgressCard from '../components/JobProgressCard';
import { retryJob } from '../store/scrapeProgressSlice';
import { useDispatch } from 'react-redux';

const Container = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: var(--space-6);
`;

const Header = styled.div`
  margin-bottom: var(--space-6);
`;

const Title = styled.h1`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin: 0 0 var(--space-2) 0;
`;

const Subtitle = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-gray-600);
  margin: 0 0 var(--space-4) 0;
`;

const ConnectionStatus = styled.div<{ isConnected: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  background-color: ${props =>
    props.isConnected ? 'var(--color-green-100)' : 'var(--color-red-100)'};
  color: ${props =>
    props.isConnected ? 'var(--color-green-700)' : 'var(--color-red-700)'};
`;

const StatusDot = styled.div<{ isConnected: boolean }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--radius-full);
  background-color: ${props =>
    props.isConnected ? 'var(--color-green-500)' : 'var(--color-red-500)'};
  margin-right: var(--space-2);
`;

const AddUrlSection = styled.div`
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
`;

const AddUrlTitle = styled.h2`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin: 0 0 var(--space-4) 0;
`;

const Form = styled.form`
  display: flex;
  gap: var(--space-3);
  align-items: flex-end;
`;

const InputGroup = styled.div`
  flex: 1;
`;

const Label = styled.label`
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--space-1);
`;

const Input = styled.input`
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px var(--color-primary-100);
  }

  &::placeholder {
    color: var(--color-gray-400);
  }
`;

const Button = styled.button<{ isLoading?: boolean }>`
  background-color: var(--color-primary-600);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color 0.2s ease;
  opacity: ${props => (props.isLoading ? 0.7 : 1)};

  &:hover:not(:disabled) {
    background-color: var(--color-primary-700);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
`;

const StatCard = styled.div`
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
  padding: var(--space-4);
  text-align: center;
`;

const StatNumber = styled.div<{ color: string }>`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: ${props => props.color};
  margin-bottom: var(--space-1);
`;

const StatLabel = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const JobsSection = styled.div`
  margin-bottom: var(--space-6);
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin: 0 0 var(--space-4) 0;
`;

const JobsGrid = styled.div`
  display: grid;
  gap: var(--space-4);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--space-8);
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
`;

const EmptyStateText = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-gray-500);
  margin: 0;
`;

const ScrapeProgressPage: React.FC = () => {
  const dispatch = useDispatch();
  const {
    activeJobs,
    completedJobs,
    failedJobs,
    connectionStatus,
    totalJobs,
    triggerScrape,
    isQueueing,
  } = useScrapeProgress();

  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    const result = await triggerScrape(url.trim());

    if (result.success) {
      setUrl('');
    } else {
      setError(result.error || 'Failed to queue scrape');
    }
  };

  const handleRetry = (jobId: string) => {
    dispatch(retryJob(jobId));
  };

  const allJobs = [...activeJobs, ...completedJobs, ...failedJobs];

  return (
    <Container>
      <Header>
        <Title>Scraping Progress</Title>
        <Subtitle>
          Monitor and manage recipe scraping jobs in real-time
        </Subtitle>
        <ConnectionStatus isConnected={connectionStatus.isConnected}>
          <StatusDot isConnected={connectionStatus.isConnected} />
          {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
          {connectionStatus.error && ` - ${connectionStatus.error}`}
        </ConnectionStatus>
      </Header>

      <AddUrlSection>
        <AddUrlTitle>Add New URL to Scrape</AddUrlTitle>
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="url">Recipe URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/recipe"
              required
            />
          </InputGroup>
          <Button type="submit" isLoading={isQueueing} disabled={isQueueing}>
            {isQueueing ? 'Queuing...' : 'Queue Scrape'}
          </Button>
        </Form>
        {error && (
          <div
            style={{
              color: 'var(--color-red-600)',
              fontSize: 'var(--font-size-sm)',
              marginTop: 'var(--space-2)',
            }}
          >
            {error}
          </div>
        )}
      </AddUrlSection>

      <StatsSection>
        <StatCard>
          <StatNumber color="var(--color-blue-600)">
            {totalJobs.active}
          </StatNumber>
          <StatLabel>Active Jobs</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber color="var(--color-green-600)">
            {totalJobs.completed}
          </StatNumber>
          <StatLabel>Completed</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber color="var(--color-red-600)">
            {totalJobs.failed}
          </StatNumber>
          <StatLabel>Failed</StatLabel>
        </StatCard>
      </StatsSection>

      {allJobs.length > 0 ? (
        <>
          {activeJobs.length > 0 && (
            <JobsSection>
              <SectionTitle>Active Jobs ({activeJobs.length})</SectionTitle>
              <JobsGrid>
                {activeJobs.map(job => (
                  <JobProgressCard key={job.id} job={job} />
                ))}
              </JobsGrid>
            </JobsSection>
          )}

          {failedJobs.length > 0 && (
            <JobsSection>
              <SectionTitle>Failed Jobs ({failedJobs.length})</SectionTitle>
              <JobsGrid>
                {failedJobs.map(job => (
                  <JobProgressCard
                    key={job.id}
                    job={job}
                    onRetry={handleRetry}
                  />
                ))}
              </JobsGrid>
            </JobsSection>
          )}

          {completedJobs.length > 0 && (
            <JobsSection>
              <SectionTitle>
                Recently Completed ({completedJobs.length})
              </SectionTitle>
              <JobsGrid>
                {completedJobs.slice(0, 5).map(job => (
                  <JobProgressCard key={job.id} job={job} />
                ))}
              </JobsGrid>
            </JobsSection>
          )}
        </>
      ) : (
        <EmptyState>
          <EmptyStateText>
            No scraping jobs yet. Add a URL above to get started!
          </EmptyStateText>
        </EmptyState>
      )}
    </Container>
  );
};

export default ScrapeProgressPage;
