import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventRecipeDto } from '../dto/invent-recipe.dto';
import { RedisService } from '../services/redis.service';
import { Auth0Guard, AuthenticatedRequest } from '../guards/auth0.guard';

@Controller('invent')
@UseGuards(Auth0Guard)
export class InventController {
  constructor(private readonly redisService: RedisService) {}

  private readonly logger = new Logger(InventController.name);

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async inventRecipe(
    @Request() req: AuthenticatedRequest,
    @Body() dto: InventRecipeDto
  ) {
    const taskId = `invent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(
      `enqueue recipe invention: ${dto.title} for user: ${req.user?.sub}`
    );

    const task = {
      id: taskId,
      ...dto,
      timestamp: Date.now(),
      userId: req.user?.sub,
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
