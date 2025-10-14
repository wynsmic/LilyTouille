import { Module } from '@nestjs/common';
import { RecipeModule } from './modules/recipe.module';
import { ScraperModule } from './modules/scraper.module';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [RecipeModule, ScraperModule],
  controllers: [HealthController],
})
export class AppModule {}
