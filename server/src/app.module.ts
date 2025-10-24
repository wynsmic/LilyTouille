import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeModule } from './modules/recipe.module';
import { ScraperModule } from './modules/scraper.module';
import { RedisModule } from './modules/redis.module';
import { HealthController } from './controllers/health.controller';
import { InventController } from './controllers/invent.controller';
import { ProgressGateway } from './gateways/progress.gateway';
import { config } from './config';
import { RecipeEntity } from './entities/recipe.entity';
import { ChunkEntity } from './entities/chunk.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: config.db.type as any,
      url: config.db.url,
      synchronize: config.db.synchronize,
      logging: config.db.logging,
      entities: [RecipeEntity, ChunkEntity],
      ssl: config.db.ssl,
    }),
    RecipeModule,
    ScraperModule,
    RedisModule,
  ],
  controllers: [HealthController, InventController],
  providers: [ProgressGateway],
})
export class AppModule {}
