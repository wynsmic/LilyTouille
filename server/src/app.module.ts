import { Module } from '@nestjs/common';
import { RecipeModule } from './modules/recipe.module';
import { ScraperModule } from './modules/scraper.module';
import { RedisModule } from './modules/redis.module';
import { HealthController } from './controllers/health.controller';
import { ProgressGateway } from './gateways/progress.gateway';

@Module({
  imports: [RecipeModule, ScraperModule, RedisModule],
  controllers: [HealthController],
  providers: [ProgressGateway],
})
export class AppModule {}
