import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ScraperService } from '../services/scraper.service';
import { ScrapeRequestDto } from '../dto/scrape-request.dto';
import { RedisService } from '../services/redis.service';
import { Logger } from '@nestjs/common';

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
  async queueScrape(@Body() dto: ScrapeRequestDto) {
    this.logger.log(`enqueue scrape via /scrape/queue: ${dto.url}`);
    await this.redisService.pushUrl(dto.url);
    return {
      message: 'URL queued for scraping',
      url: dto.url,
    };
  }

  @Get('queue/status')
  async getQueueStatus() {
    const processingQueueLength =
      await this.redisService.getQueueLength('processing');
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
