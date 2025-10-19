import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeController } from '../controllers/recipe.controller';
import { RecipeService } from '../services/recipe.service';
import { DatabaseService } from '../services/database.service';
import { RecipeEntity } from '../entities/recipe.entity';
import { RecipeRepository } from '../repositories/recipe.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RecipeEntity])],
  controllers: [RecipeController],
  providers: [RecipeService, DatabaseService, RecipeRepository],
  exports: [RecipeService, DatabaseService],
})
export class RecipeModule {}
