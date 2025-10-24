import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InventRecipeDto } from '../dto/invent-recipe.dto';
import { RedisService } from '../services/redis.service';

@Controller('invent')
export class InventController {
  constructor(private readonly redisService: RedisService) {}

  private readonly logger = new Logger(InventController.name);

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async inventRecipe(@Body() dto: InventRecipeDto) {
    const taskId = `invent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`enqueue recipe invention: ${dto.title}`);

    const task = {
      id: taskId,
      ...dto,
      timestamp: Date.now(),
    };

    await this.redisService.pushInventTask(task);

    return {
      message: 'Recipe invention request accepted',
      taskId,
      title: dto.title,
      queued: true,
    };
  }
}
