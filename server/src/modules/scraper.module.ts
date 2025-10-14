import { Module } from '@nestjs/common';
import { ScraperController } from '../controllers/scraper.controller';
import { ScraperService } from '../services/scraper.service';

@Module({
  controllers: [ScraperController],
  providers: [ScraperService],
})
export class ScraperModule {}
