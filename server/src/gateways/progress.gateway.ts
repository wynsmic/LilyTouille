import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../services/redis.service';
import { config } from '../config';
import { ProgressUpdate } from '../workers/types';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: config.app.corsOrigin,
    credentials: true,
  },
})
export class ProgressGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ProgressGateway.name);
  private isSubscribed = false;

  constructor(private readonly redisService: RedisService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

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
    try {
      this.isSubscribed = true;

      await this.redisService.subscribeToProgress((update: ProgressUpdate) => {
        this.logger.log(`Progress update: ${update.url} - ${update.stage}`);

        // Broadcast to all connected clients
        this.server.emit('progress-update', update);
      });

      this.logger.log('Subscribed to Redis progress channel');
    } catch (error) {
      this.logger.error('Failed to subscribe to progress updates:', error);
      this.isSubscribed = false;
    }
  }
}
