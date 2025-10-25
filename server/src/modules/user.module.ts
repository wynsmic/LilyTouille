import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserEntity } from '../entities/user.entity';
import { UserFavoriteEntity } from '../entities/user-favorite.entity';
import { Auth0Guard } from '../guards/auth0.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserFavoriteEntity])],
  controllers: [UserController],
  providers: [UserService, Auth0Guard],
  exports: [UserService, Auth0Guard],
})
export class UserModule {}
