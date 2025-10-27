import { createContext } from 'react';

export interface WebSocketContextType {
  isConnected: boolean;
  connectionState: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  getMetrics: () => {
    connectionAttempts: number;
    successfulConnections: number;
    failedConnections: number;
    lastConnectedAt: Date | null;
    lastDisconnectedAt: Date | null;
    totalUptime: number;
  };
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);
