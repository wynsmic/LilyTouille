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

@Controller('scrape')
export class ScraperController {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly redisService: RedisService
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async scrape(@Body() dto: ScrapeRequestDto) {
    const result = await this.scraperService.fetchAndStore(dto.url);
    return {
      message: 'Scrape completed',
      ...result,
    };
  }

  @Post('queue')
  @HttpCode(HttpStatus.OK)
  async queueScrape(@Body() dto: ScrapeRequestDto) {
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

    return {
      processing: processingQueueLength,
      ai: aiQueueLength,
      timestamp: Date.now(),
    };
  }
}
