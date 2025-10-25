import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RecipeModule } from './modules/recipe.module';
import { ScraperModule } from './modules/scraper.module';
import { RedisModule } from './modules/redis.module';
import { UserModule } from './modules/user.module';
import { HealthController } from './controllers/health.controller';
import { InventController } from './controllers/invent.controller';
import { ProgressGateway } from './gateways/progress.gateway';
import { config } from './config';
import { RecipeEntity } from './entities/recipe.entity';
import { ChunkEntity } from './entities/chunk.entity';
import { UserEntity } from './entities/user.entity';
import { UserFavoriteEntity } from './entities/user-favorite.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: config.db.type as any,
      url: config.db.url,
      synchronize: config.db.synchronize,
      logging: config.db.logging,
      entities: [RecipeEntity, ChunkEntity, UserEntity, UserFavoriteEntity],
      ssl: config.db.ssl,
    }),
    RecipeModule,
    ScraperModule,
    RedisModule,
    UserModule,
  ],
  controllers: [HealthController, InventController],
  providers: [ProgressGateway],
})
export class AppModule {}
