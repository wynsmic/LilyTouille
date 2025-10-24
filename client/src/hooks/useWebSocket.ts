import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  webSocketManager,
  ProgressUpdate,
  QueueStatus,
} from '../services/websocketManager';
import {
  updateJobProgress,
  setConnectionStatus,
  selectActiveJobs,
  selectCompletedJobs,
  selectFailedJobs,
  selectConnectionStatus,
  selectTotalJobs,
} from '../store/scrapeProgressSlice';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  enableProgressUpdates?: boolean;
  enableQueueStatus?: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    enableProgressUpdates = true,
    enableQueueStatus = true,
  } = options;

  const dispatch = useDispatch();
  const activeJobs = useSelector(selectActiveJobs);
  const completedJobs = useSelector(selectCompletedJobs);
  const failedJobs = useSelector(selectFailedJobs);
  const connectionStatus = useSelector(selectConnectionStatus);
  const totalJobs = useSelector(selectTotalJobs);

  const isInitialized = useRef(false);
  const progressUpdateHandler = useRef<
    ((update: ProgressUpdate) => void) | null
  >(null);
  const queueStatusHandler = useRef<((status: QueueStatus) => void) | null>(
    null
  );

  // Initialize WebSocket connection
  useEffect(() => {
    if (!autoConnect || isInitialized.current) {
      return;
    }

    const initializeWebSocket = async () => {
      try {
        isInitialized.current = true;

        // Connect to WebSocket
        await webSocketManager.connect();

        // Update connection status in Redux
        dispatch(
          setConnectionStatus({
            connected: true,
            error: undefined,
          })
        );

        // Join progress room
        webSocketManager.joinProgressRoom('client-' + Date.now());

        // Set up event listeners
        if (enableProgressUpdates) {
          progressUpdateHandler.current = (update: ProgressUpdate) => {
            console.log('[useWebSocket] ← progress-update', update);
            dispatch(updateJobProgress(update));
          };
          webSocketManager.on('progress-update', progressUpdateHandler.current);
        }

        if (enableQueueStatus) {
          queueStatusHandler.current = (status: QueueStatus) => {
            console.log('[useWebSocket] ← queue-status', status);
            // You can dispatch queue status updates to Redux if needed
          };
          webSocketManager.on('queue-status', queueStatusHandler.current);
        }

        // Connection state listeners
        webSocketManager.on('connect', () => {
          console.log('[useWebSocket] socket connected');
          dispatch(setConnectionStatus({ connected: true, error: undefined }));
        });

        webSocketManager.on('disconnect', () => {
          console.log('[useWebSocket] socket disconnected');
          dispatch(setConnectionStatus({ connected: false }));
        });

        webSocketManager.on('connect_error', (error: Error) => {
          console.error('[useWebSocket] socket connect_error', error);
          dispatch(
            setConnectionStatus({
              connected: false,
              error: error.message,
            })
          );
        });
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        dispatch(
          setConnectionStatus({
            connected: false,
            error: error instanceof Error ? error.message : 'Connection failed',
          })
        );
      }
    };

    initializeWebSocket();

    // Cleanup function
    return () => {
      // Remove event listeners
      if (progressUpdateHandler.current) {
        webSocketManager.off('progress-update', progressUpdateHandler.current);
        progressUpdateHandler.current = null;
      }

      if (queueStatusHandler.current) {
        webSocketManager.off('queue-status', queueStatusHandler.current);
        queueStatusHandler.current = null;
      }

      // Note: We don't disconnect here because other components might still need the connection
      // The connection will be cleaned up when the page unloads or when explicitly disconnected
    };
  }, [autoConnect, enableProgressUpdates, enableQueueStatus, dispatch]);

  // Request queue status
  const requestQueueStatus = useCallback(() => {
    if (webSocketManager.isConnected()) {
      webSocketManager.requestQueueStatus();
    } else {
      console.warn('Cannot request queue status: WebSocket not connected');
    }
  }, []);

  // Get connection metrics
  const getConnectionMetrics = useCallback(() => {
    return webSocketManager.getMetrics();
  }, []);

  // Manual connection control
  const connect = useCallback(async () => {
    try {
      await webSocketManager.connect();
    } catch (error) {
      console.error('Manual connection failed:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    webSocketManager.disconnect();
  }, []);

  return {
    // Connection state
    isConnected: webSocketManager.isConnected(),
    connectionState: webSocketManager.getConnectionState(),
    connectionStatus,

    // Job state
    activeJobs,
    completedJobs,
    failedJobs,
    totalJobs,

    // Actions
    requestQueueStatus,
    connect,
    disconnect,
    getConnectionMetrics,
  };
};

// Specialized hook for scrape progress functionality
export const useScrapeProgress = () => {
  const webSocket = useWebSocket({
    autoConnect: true,
    enableProgressUpdates: true,
    enableQueueStatus: true,
  });

  return {
    ...webSocket,
    // Additional scrape-specific functionality can be added here
  };
};
