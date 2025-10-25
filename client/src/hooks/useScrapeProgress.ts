import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { webSocketManager, ProgressUpdate } from '../services/websocketManager';
import { useQueueScrapeMutation } from '../services/scrapeApi';
import { recipeKeys } from './useRecipeQueries';
import {
  addJob,
  updateJobProgress,
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeJobs = useSelector(selectActiveJobs);
  const completedJobs = useSelector(selectCompletedJobs);
  const failedJobs = useSelector(selectFailedJobs);
  const connectionStatus = useSelector(selectConnectionStatus);
  const totalJobs = useSelector(selectTotalJobs);

  const [queueScrape, { isLoading: isQueueing }] = useQueueScrapeMutation();
  const progressUpdateHandler = useRef<
    ((update: ProgressUpdate) => void) | null
  >(null);

  // Set up progress update listener
  useEffect(() => {
    // Create the handler function
    progressUpdateHandler.current = (update: ProgressUpdate) => {
      console.log('[useScrapeProgress] ← progress-update', update);
      dispatch(updateJobProgress(update));

      if (update.stage === 'stored' && typeof update.recipeId === 'number') {
        // Invalidate recipes cache to refresh the list
        queryClient.invalidateQueries({ queryKey: recipeKeys.all });
        // Navigate to the new recipe
        navigate(`/recipe/${update.recipeId}`);
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
  }, [dispatch, navigate, queryClient]);

  // Trigger a new scrape
  const triggerScrape = useCallback(
    async (url: string) => {
      try {
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Add job to state
        dispatch(addJob({ id: jobId, url, type: 'scrape' }));

        // Queue the scrape
        console.log('[Hook] → queueScrape', { url });
        await queueScrape({ url }).unwrap();
        console.log('[Hook] ✓ queued', { url });

        return { success: true, jobId };
      } catch (error) {
        console.error('[Hook] Failed to queue scrape:', error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to queue scrape',
        };
      }
    },
    [dispatch, queueScrape]
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
