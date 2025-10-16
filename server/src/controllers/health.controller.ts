import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get()
  getRoot() {
    return {
      message: 'LilyTouille NestJS API Server',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        recipes: '/api/recipes',
        health: '/api/health',
      },
    };
  }
}
