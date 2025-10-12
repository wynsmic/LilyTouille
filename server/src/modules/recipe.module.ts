import { Module } from '@nestjs/common';
import { RecipeController } from '../controllers/recipe.controller';
import { RecipeService } from '../services/recipe.service';

@Module({
  controllers: [RecipeController],
  providers: [RecipeService],
  exports: [RecipeService],
})
export class RecipeModule {}
