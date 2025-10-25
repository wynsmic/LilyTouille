import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserEntity } from '../entities/user.entity';
import { UserFavoriteEntity } from '../entities/user-favorite.entity';
import { Auth0Guard } from '../guards/auth0.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserFavoriteEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('AUTH0_PUBLIC_KEY'),
        verifyOptions: {
          audience: configService.get<string>('AUTH0_AUDIENCE'),
          issuer: `https://${configService.get<string>('AUTH0_DOMAIN')}/`,
          algorithms: ['RS256'],
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [UserService, Auth0Guard],
  exports: [UserService, Auth0Guard],
})
export class UserModule {}
