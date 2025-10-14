import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { webSocketService, ProgressUpdate } from '../services/websocket';
import { useQueueScrapeMutation } from '../services/scrapeApi';
import {
  addJob,
  updateJobProgress,
  setConnectionStatus,
  selectActiveJobs,
  selectCompletedJobs,
  selectFailedJobs,
  selectConnectionStatus,
  selectTotalJobs,
} from '../store/scrapeProgressSlice';
import { RootState } from '../store';

export const useScrapeProgress = () => {
  const dispatch = useDispatch();
  const activeJobs = useSelector(selectActiveJobs);
  const completedJobs = useSelector(selectCompletedJobs);
  const failedJobs = useSelector(selectFailedJobs);
  const connectionStatus = useSelector(selectConnectionStatus);
  const totalJobs = useSelector(selectTotalJobs);

  const [queueScrape, { isLoading: isQueueing }] = useQueueScrapeMutation();

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        await webSocketService.connect();
        dispatch(setConnectionStatus({ connected: true }));

        // Join progress room
        webSocketService.joinProgressRoom('client-' + Date.now());

        // Set up event listeners
        webSocketService.on('progress-update', (update: ProgressUpdate) => {
          dispatch(updateJobProgress(update));
        });

        webSocketService.on('connect', () => {
          dispatch(setConnectionStatus({ connected: true }));
        });

        webSocketService.on('disconnect', () => {
          dispatch(setConnectionStatus({ connected: false }));
        });

        webSocketService.on('connect_error', error => {
          dispatch(
            setConnectionStatus({ connected: false, error: error.message })
          );
        });
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        dispatch(
          setConnectionStatus({
            connected: false,
            error: error instanceof Error ? error.message : 'Connection failed',
          })
        );
      }
    };

    initializeWebSocket();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, [dispatch]);

  // Trigger a new scrape
  const triggerScrape = useCallback(
    async (url: string) => {
      try {
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Add job to state
        dispatch(addJob({ id: jobId, url }));

        // Queue the scrape
        await queueScrape({ url }).unwrap();

        return { success: true, jobId };
      } catch (error) {
        console.error('Failed to queue scrape:', error);
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
    webSocketService.requestQueueStatus();
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
    isConnected: webSocketService.isConnected(),
  };
};

// Hook for getting individual job details
export const useScrapeJob = (jobId: string) => {
  return useSelector((state: RootState) => {
    const activeJob = state.scrapeProgress.activeJobs[jobId];
    const completedJob = state.scrapeProgress.completedJobs.find(
      job => job.id === jobId
    );
    const failedJob = state.scrapeProgress.failedJobs.find(
      job => job.id === jobId
    );

    return activeJob || completedJob || failedJob || null;
  });
};
