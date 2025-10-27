import { useContext } from 'react';
import { WebSocketContext, WebSocketContextType } from './webSocketContext';

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
