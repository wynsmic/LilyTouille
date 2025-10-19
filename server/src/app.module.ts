import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeModule } from './modules/recipe.module';
import { ScraperModule } from './modules/scraper.module';
import { RedisModule } from './modules/redis.module';
import { HealthController } from './controllers/health.controller';
import { ProgressGateway } from './gateways/progress.gateway';
import { config } from './config';
import { RecipeEntity } from './entities/recipe.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: config.db.database,
      synchronize: config.db.synchronize,
      logging: config.db.logging,
      entities: [RecipeEntity],
    }),
    RecipeModule,
    ScraperModule,
    RedisModule,
  ],
  controllers: [HealthController],
  providers: [ProgressGateway],
})
export class AppModule {}
