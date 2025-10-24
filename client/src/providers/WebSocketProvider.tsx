import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { webSocketManager } from '../services/websocketManager';
import { setConnectionStatus } from '../store/scrapeProgressSlice';

interface WebSocketContextType {
  isConnected: boolean;
  connectionState: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  getMetrics: () => any;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  autoConnect = true,
}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!autoConnect) return;

    const initializeConnection = async () => {
      try {
        await webSocketManager.connect();
        dispatch(setConnectionStatus({ connected: true, error: undefined }));

        // Join progress room
        webSocketManager.joinProgressRoom('app-' + Date.now());

        // Set up global connection state listeners
        webSocketManager.on('connect', () => {
          console.log('[WebSocketProvider] Connected');
          dispatch(setConnectionStatus({ connected: true, error: undefined }));
        });

        webSocketManager.on('disconnect', () => {
          console.log('[WebSocketProvider] Disconnected');
          dispatch(setConnectionStatus({ connected: false }));
        });

        webSocketManager.on('connect_error', (error: Error) => {
          console.error('[WebSocketProvider] Connection error:', error);
          dispatch(
            setConnectionStatus({
              connected: false,
              error: error.message,
            })
          );
        });
      } catch (error) {
        console.error(
          '[WebSocketProvider] Failed to initialize connection:',
          error
        );
        dispatch(
          setConnectionStatus({
            connected: false,
            error: error instanceof Error ? error.message : 'Connection failed',
          })
        );
      }
    };

    initializeConnection();

    // Cleanup on unmount
    return () => {
      webSocketManager.off('connect');
      webSocketManager.off('disconnect');
      webSocketManager.off('connect_error');
      // Note: We don't disconnect here as the connection should persist
      // until the page is closed or explicitly disconnected
    };
  }, [autoConnect, dispatch]);

  const contextValue: WebSocketContextType = {
    isConnected: webSocketManager.isConnected(),
    connectionState: webSocketManager.getConnectionState(),
    connect: async () => {
      await webSocketManager.connect();
    },
    disconnect: () => {
      webSocketManager.disconnect();
    },
    getMetrics: () => {
      return webSocketManager.getMetrics();
    },
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      'useWebSocketContext must be used within a WebSocketProvider'
    );
  }
  return context;
};
