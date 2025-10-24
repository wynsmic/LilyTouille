import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { webSocketManager, ProgressUpdate } from '../services/websocketManager';
import { useInventRecipeMutation } from '../services/inventApi';
import { recipeKeys } from './useRecipeQueries';
import {
  addJob,
  updateJobProgress,
  selectActiveJobs,
  selectCompletedJobs,
  selectFailedJobs,
  selectConnectionStatus,
  selectTotalJobs,
} from '../store/scrapeProgressSlice';
import { RootState } from '../store';

export const useInventProgress = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeJobs = useSelector(selectActiveJobs);
  const completedJobs = useSelector(selectCompletedJobs);
  const failedJobs = useSelector(selectFailedJobs);
  const connectionStatus = useSelector(selectConnectionStatus);
  const totalJobs = useSelector(selectTotalJobs);

  const [inventRecipe, { isLoading: isInventing }] = useInventRecipeMutation();
  const progressUpdateHandler = useRef<
    ((update: ProgressUpdate) => void) | null
  >(null);

  // Set up progress update listener
  useEffect(() => {
    // Create the handler function
    progressUpdateHandler.current = (update: ProgressUpdate) => {
      console.log('[useInventProgress] ← progress-update', update);
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

  // Trigger a new recipe invention
  const triggerInvent = useCallback(
    async (inventData: any) => {
      try {
        const jobId = `invent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Add job to state
        dispatch(
          addJob({
            id: jobId,
            url: jobId, // Use jobId as URL for invention jobs
            type: 'invent',
            title: inventData.title,
          })
        );

        // Queue the invention
        console.log('[Hook] → inventRecipe', { title: inventData.title });
        const result = await inventRecipe(inventData).unwrap();
        console.log('[Hook] ✓ queued', { taskId: result.taskId });

        return { success: true, jobId };
      } catch (error) {
        console.error('[Hook] Failed to queue invention:', error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to queue invention',
        };
      }
    },
    [dispatch, inventRecipe]
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
    triggerInvent,
    requestQueueStatus,
    isInventing,

    // WebSocket status
    isConnected: webSocketManager.isConnected(),
  };
};

// Hook for getting individual job details
export const useInventJob = (jobId: string) => {
  return useSelector((state: RootState) => {
    const activeJob = state.jobProgress.activeJobs[jobId];
    const completedJob = state.jobProgress.completedJobs.find(
      job => job.id === jobId
    );
    const failedJob = state.jobProgress.failedJobs.find(
      job => job.id === jobId
    );

    return activeJob || completedJob || failedJob || null;
  });
};
