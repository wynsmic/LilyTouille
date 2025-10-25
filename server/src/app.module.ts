import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
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
import { JwtStrategy } from './strategies/jwt.strategy';
import { WebSocketJwtStrategy } from './strategies/websocket-jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('AUTH0_DOMAIN'),
        audience: configService.get('AUTH0_AUDIENCE'),
        issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
        algorithms: ['RS256'],
      }),
      inject: [ConfigService],
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
  providers: [ProgressGateway, JwtStrategy, WebSocketJwtStrategy],
})
export class AppModule {}
