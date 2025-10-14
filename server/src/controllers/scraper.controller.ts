import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ScraperService } from '../services/scraper.service';
import { ScrapeRequestDto } from '../dto/scrape-request.dto';

@Controller('scrape')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async scrape(@Body() dto: ScrapeRequestDto) {
    const result = await this.scraperService.fetchAndStore(dto.url);
    return {
      message: 'Scrape completed',
      ...result,
    };
  }
}
