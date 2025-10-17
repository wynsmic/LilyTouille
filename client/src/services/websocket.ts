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

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Remove /api suffix for websocket connections
      const apiUrl =
        import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const serverUrl = apiUrl.replace('/api', '');
      console.log('[WebSocket] Attempting to connect to:', serverUrl);

      this.socket = io(serverUrl, {
        transports: ['websocket'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[WebSocket] ✅ connected', {
          url: serverUrl,
          socketId: this.socket?.id,
          transport: this.socket?.io.engine.transport.name,
        });
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', error => {
        console.error('[WebSocket] ❌ connection error:', {
          message: error.message,
          url: serverUrl,
          error: error,
        });
        reject(error);
      });

      this.socket.on('disconnect', reason => {
        console.log('[WebSocket] 🔌 disconnected:', reason);
        this.handleReconnect();
      });

      // Set up automatic reconnection
      this.socket.on('reconnect', attemptNumber => {
        console.log('[WebSocket] 🔄 reconnected', { attemptNumber });
        this.reconnectAttempts = 0;
      });

      this.socket.on('reconnect_error', error => {
        console.error('[WebSocket] ❌ reconnection error:', error);
        this.reconnectAttempts++;
      });

      this.socket.on('reconnect_failed', () => {
        console.error('[WebSocket] ❌ reconnection failed');
      });

      // Add ping/pong listeners to debug connection issues
      this.socket.on('ping', () => {
        console.log('[WebSocket] 📡 received ping from server');
      });

      this.socket.on('pong', latency => {
        console.log(
          '[WebSocket] 📡 received pong from server, latency:',
          latency,
          'ms'
        );
      });
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(
        `🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, delay);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event listeners
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) {
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off<K extends keyof WebSocketEvents>(
    event: K,
    callback?: WebSocketEvents[K]
  ) {
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  // Emit events
  emit(event: string, data?: any) {
    if (this.socket) {
      console.log('[WebSocket] → emit', event, data);
      this.socket.emit(event, data);
    }
  }

  // Join progress room
  joinProgressRoom(clientId: string) {
    console.log('[WebSocket] join-progress-room', { clientId });
    this.emit('join-progress-room', { clientId });
  }

  // Request queue status
  requestQueueStatus() {
    console.log('[WebSocket] get-queue-status');
    this.emit('get-queue-status');
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();

// Export types for use in components
export type { ProgressUpdate };
