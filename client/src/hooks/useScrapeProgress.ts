import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { webSocketManager, ProgressUpdate } from '../services/websocketManager';
import { useQueueScrapeMutation } from '../services/scrapeApi';
import { useAuth0 } from '@auth0/auth0-react';
import { recipeKeys } from './useRecipeQueries';
import {
  addJob,
  updateJobProgress,
  removeJob,
  selectActiveJobs,
  selectCompletedJobs,
  selectFailedJobs,
  selectConnectionStatus,
  selectTotalJobs,
  selectJobById,
} from '../store/scrapeProgressSlice';
import { RootState } from '../store';

export const useScrapeProgress = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const activeJobs = useSelector(selectActiveJobs);
  const completedJobs = useSelector(selectCompletedJobs);
  const failedJobs = useSelector(selectFailedJobs);
  const connectionStatus = useSelector(selectConnectionStatus);
  const totalJobs = useSelector(selectTotalJobs);

  const [queueScrape, { isLoading: isQueueing }] = useQueueScrapeMutation();
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const progressUpdateHandler = useRef<((update: ProgressUpdate) => void) | null>(null);

  // Set up progress update listener
  useEffect(() => {
    // Create the handler function
    progressUpdateHandler.current = (update: ProgressUpdate) => {
      console.log('[useScrapeProgress] ← progress-update', update);
      dispatch(updateJobProgress(update));

      if (update.stage === 'stored' && typeof update.recipeId === 'number') {
        // Invalidate recipes cache to refresh the list
        queryClient.invalidateQueries({ queryKey: recipeKeys.all });
        // Note: Navigation is now handled by the ScrapeReviewModal
        // Don't auto-navigate here anymore
      }
    };

    // Add the listener
    if (progressUpdateHandler.current) {
      webSocketManager.on('progress-update', progressUpdateHandler.current);
    }

    // Cleanup
    return () => {
      if (progressUpdateHandler.current) {
        webSocketManager.off('progress-update', progressUpdateHandler.current);
        progressUpdateHandler.current = null;
      }
    };
  }, [dispatch, queryClient]);

  // Trigger a new scrape
  const triggerScrape = useCallback(
    async (url: string) => {
      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        // Add job to state
        dispatch(addJob({ id: jobId, url, type: 'scrape' }));

        // Queue the scrape
        console.log('[Hook] → queueScrape', { url });
        const token = isAuthenticated ? await getAccessTokenSilently() : undefined;
        await queueScrape({ url, token }).unwrap();
        console.log('[Hook] ✓ queued', { url });

        return { success: true, jobId };
      } catch (error: unknown) {
        console.error('[Hook] Failed to queue scrape:', error);

        // Remove the job from state since it failed
        dispatch(removeJob(jobId));

        let errorMessage = 'Failed to queue scrape';

        if (typeof error === 'object' && error !== null && 'status' in error) {
          const errorWithStatus = error as {
            status?: number;
            data?: { message?: string };
            message?: string;
          };
          if (errorWithStatus.status === 404) {
            errorMessage = 'Scraping service is currently unavailable. Please try again later.';
          } else if (errorWithStatus.status === 500) {
            errorMessage = 'Server error occurred. Please try again later.';
          } else if (errorWithStatus.status === 0) {
            errorMessage = 'Unable to connect to the server. Please check your connection.';
          } else if (errorWithStatus.data?.message) {
            errorMessage = errorWithStatus.data.message;
          } else if (errorWithStatus.message) {
            errorMessage = errorWithStatus.message;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        return {
          success: false,
          error: errorMessage,
          status:
            typeof error === 'object' && error !== null && 'status' in error
              ? (error as { status?: number }).status
              : undefined,
        };
      }
    },
    [dispatch, queueScrape, isAuthenticated, getAccessTokenSilently],
  );

  // Request queue status
  const requestQueueStatus = useCallback(() => {
    webSocketManager.requestQueueStatus();
  }, []);

  return {
    // State
    activeJobs,
    completedJobs,
    failedJobs,
    connectionStatus,
    totalJobs,

    // Actions
    triggerScrape,
    requestQueueStatus,
    isQueueing,

    // WebSocket status
    isConnected: webSocketManager.isConnected(),
  };
};

// Hook for getting individual job details
export const useScrapeJob = (jobId: string) => {
  return useSelector((state: RootState) => selectJobById(state)(jobId));
};
