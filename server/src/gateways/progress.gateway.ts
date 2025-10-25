import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../services/redis.service';
import { config } from '../config';
import { ProgressUpdate } from '../workers/types';
import { WebSocketJwtStrategy } from '../strategies/websocket-jwt.strategy';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: config.app.corsOrigin,
    credentials: true,
  },
  namespace: '/',
})
export class ProgressGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ProgressGateway.name);
  private isSubscribed = false;

  constructor(
    private readonly redisService: RedisService,
    private readonly webSocketJwtStrategy: WebSocketJwtStrategy
  ) {}

  async onModuleInit() {
    this.logger.log('ProgressGateway initialized');

    // Add connection attempt logging
    this.server.on('connection', socket => {
      this.logger.log(`New connection attempt from: ${socket.id}`);
    });

    // Subscribe immediately on startup to avoid missing early events
    if (!this.isSubscribed) {
      await this.subscribeToProgressUpdates();
    }
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      // Authenticate the client
      const user = await this.authenticateClient(client);
      if (user) {
        // Store user info in socket data
        client.data.user = user;

        // Join user-specific room
        const userRoom = `user:${user.sub}`;
        await client.join(userRoom);
        this.logger.log(`Client ${client.id} joined user room: ${userRoom}`);

        // Send welcome message
        client.emit('authenticated', {
          userId: user.sub,
          message: 'Successfully authenticated',
        });
      } else {
        this.logger.warn(`Client ${client.id} failed authentication`);
        client.emit('auth-error', { message: 'Authentication failed' });
        client.disconnect();
        return;
      }
    } catch (error) {
      this.logger.error(`Authentication error for client ${client.id}:`, error);
      client.emit('auth-error', { message: 'Authentication error' });
      client.disconnect();
      return;
    }

    try {
      // Safely check if server and sockets are available
      if (this.server && this.server.sockets && this.server.sockets.sockets) {
        const clientIds: string[] = Array.from(
          this.server.sockets.sockets.keys()
        );
        this.logger.log(
          `Currently connected clients (${clientIds.length}): [${clientIds.join(', ')}]`
        );
      } else {
        this.logger.warn('Server sockets not available during connection');
      }
    } catch (e) {
      this.logger.error('Error listing connected clients on connect', e as any);
    }

    // Subscribe to Redis progress channel if not already subscribed
    if (!this.isSubscribed) {
      await this.subscribeToProgressUpdates();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`Client disconnected: ${client.id} (user: ${user.sub})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  private async authenticateClient(client: Socket): Promise<any> {
    try {
      // Use the WebSocket JWT strategy to validate the token
      const user = await this.webSocketJwtStrategy.validate(client);
      return user;
    } catch (error) {
      this.logger.error(
        `Token verification failed for client ${client.id}:`,
        error
      );
      return null;
    }
  }

  @SubscribeMessage('join-progress-room')
  handleJoinProgressRoom(@MessageBody() data: { clientId: string }) {
    this.logger.log(`Client ${data.clientId} joined progress room`);
    // Clients automatically join the default room, but we can create specific rooms if needed
  }

  @SubscribeMessage('get-queue-status')
  async handleGetQueueStatus() {
    try {
      const processingQueueLength =
        await this.redisService.getQueueLength('processing');
      const aiQueueLength = await this.redisService.getQueueLength('ai');

      this.server.emit('queue-status', {
        processing: processingQueueLength,
        ai: aiQueueLength,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      this.logger.error('Failed to get queue status:', error);
      this.server.emit('queue-status-error', { error: error.message });
    }
  }

  private async subscribeToProgressUpdates() {
    if (this.isSubscribed) {
      this.logger.log('Already subscribed to progress updates, skipping');
      return;
    }

    try {
      this.isSubscribed = true;

      await this.redisService.subscribeToProgress((update: ProgressUpdate) => {
        this.logger.log(
          `Progress update received: ${update.url} - ${update.stage}${update.userId ? ` (user: ${update.userId})` : ''}`
        );

        // Check if server is available and has connected clients
        if (!this.server) {
          this.logger.warn('WebSocket server not available for broadcasting');
          return;
        }

        try {
          if (update.userId) {
            // Broadcast to specific user room
            const userRoom = `user:${update.userId}`;
            const room = this.server.to(userRoom);

            if (room) {
              room.emit('progress-update', update);
              this.logger.log(
                `✅ Successfully broadcasted progress-update: ${update.url} - ${update.stage} to user room: ${userRoom}`
              );
            } else {
              this.logger.warn(`User room ${userRoom} not found or empty`);
            }
          } else {
            // Fallback: broadcast to all connected clients (for backward compatibility)
            this.server.emit('progress-update', update);
            this.logger.log(
              `✅ Successfully broadcasted progress-update: ${update.url} - ${update.stage} to all clients (no userId specified)`
            );
          }
        } catch (e) {
          this.logger.error('Failed to broadcast progress-update', e as any);
        }
      });

      this.logger.log('✅ Successfully subscribed to Redis progress channel');
    } catch (error) {
      this.logger.error('Failed to subscribe to progress updates:', error);
      this.isSubscribed = false;
    }
  }
}
