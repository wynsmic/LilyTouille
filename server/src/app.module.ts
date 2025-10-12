import { Module } from '@nestjs/common';
import { RecipeModule } from './modules/recipe.module';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [RecipeModule],
  controllers: [HealthController],
})
export class AppModule {}
