import { Body, Controller, Get, HttpCode, HttpStatus, Post, Logger, Req } from '@nestjs/common';
import { ScraperService } from '../services/scraper.service';
import { ScrapeRequestDto } from '../dto/scrape-request.dto';
import { RedisService } from '../services/redis.service';
import type { Request } from 'express';
import { DatabaseService } from '../services/database.service';

@Controller('scrape')
export class ScraperController {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly redisService: RedisService,
  ) {}

  private readonly logger = new Logger(ScraperController.name);

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async scrape(@Body() dto: ScrapeRequestDto) {
    this.logger.log(`enqueue scrape via /scrape: ${dto.url}`);
    await this.redisService.pushUrl(dto.url);
    return {
      message: 'URL accepted for scraping',
      url: dto.url,
      queued: true,
    };
  }

  @Post('queue')
  @HttpCode(HttpStatus.OK)
  async queueScrape(@Body() dto: ScrapeRequestDto, @Req() req: Request) {
    this.logger.log(`enqueue scrape via /scrape/queue: ${dto.url}`);
    // Try to extract user sub from Authorization header if present (optional)
    let queuedUrl = dto.url;
    let ownerUserId: number | undefined;
    const db = new DatabaseService();
    await db.initialize();
    const auth = req.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const token = auth.slice('Bearer '.length);
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as {
          sub?: string;
          email?: string;
        };
        if (payload?.sub) {
          queuedUrl = `${dto.url}|owner:${payload.sub}`;
          // Resolve or create user by email or sub
          const userRepo = db.getUserRepository();
          const bySub = await userRepo.findByAuth0Id(payload.sub);
          if (bySub) {
            ownerUserId = bySub.id;
          } else if (payload.email) {
            const byEmail = await userRepo.findByEmail(payload.email);
            if (byEmail) {
              ownerUserId = byEmail.id;
            } else {
              const created = await userRepo.save({ auth0Id: payload.sub, email: payload.email, language: 'en' });
              ownerUserId = created.id;
            }
          } else {
            const created = await userRepo.save({ auth0Id: payload.sub, language: 'en' });
            ownerUserId = created.id;
          }
        }
      } catch {
        // ignore
      }
    }
    // Attach ownerUserId in side-channel if available
    if (ownerUserId) {
      queuedUrl = `${queuedUrl}|ownerUserId:${ownerUserId}`;
    }
    await this.redisService.pushUrl(queuedUrl);
    return {
      message: 'URL queued for scraping',
      url: dto.url,
    };
  }

  @Get('queue/status')
  async getQueueStatus() {
    const processingQueueLength = await this.redisService.getQueueLength('processing');
    const aiQueueLength = await this.redisService.getQueueLength('ai');
    const inventQueueLength = await this.redisService.getQueueLength('invent');

    return {
      processing: processingQueueLength,
      ai: aiQueueLength,
      invent: inventQueueLength,
      timestamp: Date.now(),
    };
  }
}
