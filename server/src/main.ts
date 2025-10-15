import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { config } from './config';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './logger';
import { startWorkers } from './workers/launcher';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({ origin: config.app.corsOrigin });

  // Security & request logging middleware
  app.use(helmet());
  app.use(morgan('combined'));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  const port = config.app.port;
  await app.listen(port);

  logger.info(`NestJS Server running on port ${port}`);
  logger.info(`Health check: http://localhost:${port}/api/health`);
  logger.info(`Recipes API: http://localhost:${port}/api/recipes`);

  // Optionally auto-start background workers as child processes
  if (config.workers.autoStart) {
    startWorkers();
  }
}

bootstrap();
