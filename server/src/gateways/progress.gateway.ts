import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../services/redis.service';
import { config } from '../config';
import { ProgressUpdate } from '../workers/types';

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

  constructor(private readonly redisService: RedisService) {}

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
    this.logger.log(`Client disconnected: ${client.id}`);
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
          `Progress update received: ${update.url} - ${update.stage}`
        );

        // Check if server is available and has connected clients
        if (!this.server) {
          this.logger.warn('WebSocket server not available for broadcasting');
          return;
        }

        // Safely get connected clients count
        let connectedClients = 0;
        try {
          if (this.server.sockets && this.server.sockets.sockets) {
            connectedClients = this.server.sockets.sockets.size;
          } else if (this.server.engine && this.server.engine.clientsCount) {
            connectedClients = this.server.engine.clientsCount;
          }
        } catch (e) {
          this.logger.warn(
            'Could not determine connected clients count',
            e as any
          );
        }

        this.logger.log(
          `Broadcasting to ${connectedClients} connected clients`
        );

        // Broadcast to all connected clients
        try {
          this.server.emit('progress-update', update);
          this.logger.log(
            `✅ Successfully broadcasted progress-update: ${update.url} - ${update.stage} to ${connectedClients} clients`
          );
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
