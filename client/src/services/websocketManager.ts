import { io, Socket } from 'socket.io-client';
import { ProgressUpdate } from './types';

export interface QueueStatus {
  processing: number;
  ai: number;
  timestamp: number;
}

export interface WebSocketEvents {
  'progress-update': (update: ProgressUpdate) => void;
  'queue-status': (status: QueueStatus) => void;
  'queue-status-error': (error: { error: string }) => void;
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

interface ConnectionConfig {
  maxReconnectAttempts: number;
  reconnectDelay: number;
  maxReconnectDelay: number;
  connectionTimeout: number;
  heartbeatInterval: number;
}

interface ConnectionMetrics {
  connectionAttempts: number;
  successfulConnections: number;
  failedConnections: number;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  totalUptime: number;
}

class WebSocketManager {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  private connectionStartTime: number | null = null;
  private eventListeners = new Map<string, Set<Function>>();

  private readonly config: ConnectionConfig = {
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    connectionTimeout: 20000,
    heartbeatInterval: 30000,
  };

  private readonly metrics: ConnectionMetrics = {
    connectionAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    totalUptime: 0,
  };

  private readonly logger = {
    log: (message: string, data?: any) => {
      console.log(`[WebSocketManager] ${message}`, data || '');
    },
    error: (message: string, error?: any) => {
      console.error(`[WebSocketManager] ${message}`, error || '');
    },
    warn: (message: string, data?: any) => {
      console.warn(`[WebSocketManager] ${message}`, data || '');
    },
  };

  constructor() {
    // Initialize singleton
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandling();
    }
  }

  private setupGlobalErrorHandling() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logger.log('Page hidden, pausing heartbeat');
        this.pauseHeartbeat();
      } else {
        this.logger.log('Page visible, resuming heartbeat');
        this.resumeHeartbeat();
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.logger.log('Page unloading, cleaning up connection');
      this.cleanup();
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      this.logger.log('Network online, attempting reconnection');
      if (
        this.connectionState === 'disconnected' ||
        this.connectionState === 'error'
      ) {
        this.connect();
      }
    });

    window.addEventListener('offline', () => {
      this.logger.log('Network offline, marking as disconnected');
      this.setConnectionState('disconnected');
    });
  }

  async connect(): Promise<void> {
    if (
      this.connectionState === 'connected' ||
      this.connectionState === 'connecting'
    ) {
      this.logger.log('Already connected or connecting, skipping');
      return;
    }

    this.metrics.connectionAttempts++;
    this.setConnectionState('connecting');

    return new Promise((resolve, reject) => {
      try {
        const apiUrl =
          import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const serverUrl = apiUrl.replace('/api', '');

        this.logger.log('Attempting to connect to:', serverUrl);

        // Clean up existing connection
        if (this.socket) {
          this.socket.removeAllListeners();
          this.socket.disconnect();
        }

        this.socket = io(serverUrl, {
          transports: ['websocket'],
          timeout: this.config.connectionTimeout,
          forceNew: true,
          reconnection: false, // We handle reconnection manually
          autoConnect: true,
        });

        this.setupSocketEventListeners(resolve, reject);
      } catch (error) {
        this.logger.error('Failed to create socket connection:', error);
        this.setConnectionState('error');
        reject(error);
      }
    });
  }

  private setupSocketEventListeners(
    resolve: () => void,
    reject: (error: Error) => void
  ) {
    if (!this.socket) return;

    const connectionTimeout = setTimeout(() => {
      this.logger.error('Connection timeout');
      this.setConnectionState('error');
      reject(new Error('Connection timeout'));
    }, this.config.connectionTimeout);

    this.socket.on('connect', () => {
      clearTimeout(connectionTimeout);
      this.logger.log('✅ Connected', {
        socketId: this.socket?.id,
        transport: this.socket?.io.engine.transport.name,
        attempt: this.reconnectAttempts + 1,
      });

      this.metrics.successfulConnections++;
      this.metrics.lastConnectedAt = new Date();
      this.connectionStartTime = Date.now();
      this.reconnectAttempts = 0;
      this.setConnectionState('connected');

      this.startHeartbeat();
      this.emit('connect');
      resolve();
    });

    this.socket.on('connect_error', error => {
      clearTimeout(connectionTimeout);
      this.logger.error('❌ Connection error:', error);
      this.metrics.failedConnections++;
      this.setConnectionState('error');
      this.emit('connect_error', error);
      reject(error);
    });

    this.socket.on('disconnect', reason => {
      this.logger.log('🔌 Disconnected:', reason);
      this.metrics.lastDisconnectedAt = new Date();

      if (this.connectionStartTime) {
        this.metrics.totalUptime += Date.now() - this.connectionStartTime;
        this.connectionStartTime = null;
      }

      this.stopHeartbeat();
      this.setConnectionState('disconnected');
      this.emit('disconnect');

      // Handle reconnection based on disconnect reason
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        this.logger.log('Server initiated disconnect, not reconnecting');
      } else if (reason === 'io client disconnect') {
        // Client initiated disconnect, don't reconnect
        this.logger.log('Client initiated disconnect, not reconnecting');
      } else {
        // Network issues, attempt reconnection
        this.handleReconnection();
      }
    });

    // Set up application-specific event listeners
    this.socket.on('progress-update', (update: ProgressUpdate) => {
      this.logger.log('← progress-update', update);
      this.emit('progress-update', update);
    });

    this.socket.on('queue-status', (status: QueueStatus) => {
      this.logger.log('← queue-status', status);
      this.emit('queue-status', status);
    });

    this.socket.on('queue-status-error', (error: { error: string }) => {
      this.logger.error('← queue-status-error', error);
      this.emit('queue-status-error', error);
    });

    // Add ping/pong listeners for connection health monitoring
    this.socket.on('ping', () => {
      this.logger.log('📡 Received ping from server');
    });

    this.socket.on('pong', (latency: number) => {
      this.logger.log(`📡 Received pong from server, latency: ${latency}ms`);
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached');
      this.setConnectionState('error');
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState('reconnecting');

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );

    this.logger.log(
      `🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    );

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect().catch(error => {
        this.logger.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat

    this.heartbeatIntervalId = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  private pauseHeartbeat() {
    this.stopHeartbeat();
  }

  private resumeHeartbeat() {
    if (this.connectionState === 'connected') {
      this.startHeartbeat();
    }
  }

  private setConnectionState(state: ConnectionState) {
    if (this.connectionState !== state) {
      const previousState = this.connectionState;
      this.connectionState = state;
      this.logger.log(`Connection state changed: ${previousState} → ${state}`);
    }
  }

  disconnect() {
    this.logger.log('Disconnecting...');

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    this.stopHeartbeat();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.setConnectionState('disconnected');
    this.reconnectAttempts = 0;
  }

  private cleanup() {
    this.logger.log('Cleaning up WebSocket connection');
    this.disconnect();
    this.eventListeners.clear();
  }

  // Public API
  isConnected(): boolean {
    return (
      this.connectionState === 'connected' && this.socket?.connected === true
    );
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  // Event system
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off<K extends keyof WebSocketEvents>(
    event: K,
    callback?: WebSocketEvents[K]
  ) {
    const listeners = this.eventListeners.get(event);
    if (listeners && callback) {
      listeners.delete(callback);
    } else if (listeners) {
      listeners.clear();
    }
  }

  private emit<K extends keyof WebSocketEvents>(
    event: K,
    ...args: Parameters<WebSocketEvents[K]>
  ) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as any)(...args);
        } catch (error) {
          this.logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Application-specific methods
  joinProgressRoom(clientId: string) {
    this.logger.log('join-progress-room', { clientId });
    this.sendMessage('join-progress-room', { clientId });
  }

  requestQueueStatus() {
    this.logger.log('get-queue-status');
    this.sendMessage('get-queue-status');
  }

  sendMessage(event: string, data?: any) {
    if (this.socket?.connected) {
      this.logger.log(`→ emit ${event}`, data);
      this.socket.emit(event, data);
    } else {
      this.logger.warn(`Cannot emit ${event}: not connected`);
    }
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketManager();

// Export types for use in components
export type { ProgressUpdate };
