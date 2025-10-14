import { Module } from '@nestjs/common';
import { ScraperController } from '../controllers/scraper.controller';
import { ScraperService } from '../services/scraper.service';
import { RedisService } from '../services/redis.service';

@Module({
  controllers: [ScraperController],
  providers: [ScraperService, RedisService],
})
export class ScraperModule {}
