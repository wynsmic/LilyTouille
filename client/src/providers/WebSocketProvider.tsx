import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth0 } from '@auth0/auth0-react';
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
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    if (!autoConnect || !isAuthenticated) return;

    const initializeConnection = async () => {
      try {
        // Get Auth0 token for WebSocket authentication
        const token = await getAccessTokenSilently();
        await webSocketManager.connect(token);
        dispatch(setConnectionStatus({ connected: true, error: undefined }));

        // Join progress room
        webSocketManager.joinProgressRoom('app-' + Date.now());

        // Set up global connection state listeners
        webSocketManager.on('connect', () => {
          console.log('[WebSocketProvider] Connected');
          dispatch(setConnectionStatus({ connected: true, error: undefined }));
        });

        webSocketManager.on(
          'authenticated',
          (data: { userId: string; message: string }) => {
            console.log('[WebSocketProvider] Authenticated:', data);
          }
        );

        webSocketManager.on('auth-error', (error: { message: string }) => {
          console.error('[WebSocketProvider] Authentication error:', error);
          dispatch(
            setConnectionStatus({
              connected: false,
              error: `Authentication failed: ${error.message}`,
            })
          );
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
      webSocketManager.off('authenticated');
      webSocketManager.off('auth-error');
      webSocketManager.off('disconnect');
      webSocketManager.off('connect_error');
      // Note: We don't disconnect here as the connection should persist
      // until the page is closed or explicitly disconnected
    };
  }, [autoConnect, isAuthenticated, getAccessTokenSilently, dispatch]);

  const contextValue: WebSocketContextType = {
    isConnected: webSocketManager.isConnected(),
    connectionState: webSocketManager.getConnectionState(),
    connect: async () => {
      if (isAuthenticated) {
        const token = await getAccessTokenSilently();
        await webSocketManager.connect(token);
      } else {
        await webSocketManager.connect();
      }
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
