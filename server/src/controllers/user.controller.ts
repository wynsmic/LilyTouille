import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  UserService,
  CreateUserDto,
  UpdateUserPreferencesDto,
} from '../services/user.service';
import { Auth0Guard, AuthenticatedRequest } from '../guards/auth0.guard';

@Controller('users')
@UseGuards(Auth0Guard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('me')
  @HttpCode(HttpStatus.OK)
  async createOrUpdateUser(
    @Request() req: AuthenticatedRequest,
    @Body() createUserDto: CreateUserDto,
  ) {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await this.userService.findOrCreateUser(
      req.user.sub,
      createUserDto,
    );
    return {
      id: user.id,
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      language: user.language,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Get('me')
  async getCurrentUser(@Request() req: AuthenticatedRequest) {
    if (!req.user) {
      return { user: null };
    }

    const user = await this.userService.getUserByAuth0Id(req.user.sub);

    if (!user) {
      return { user: null };
    }

    return {
      id: user.id,
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      language: user.language,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Put('me/preferences')
  async updatePreferences(
    @Request() req: AuthenticatedRequest,
    @Body() preferences: UpdateUserPreferencesDto,
  ) {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await this.userService.getUserByAuth0Id(req.user.sub);

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await this.userService.updateUserPreferences(
      user.id,
      preferences,
    );

    return {
      id: updatedUser.id,
      language: updatedUser.language,
      preferences: updatedUser.preferences,
      updatedAt: updatedUser.updatedAt,
    };
  }

  @Get('me/favorites')
  async getUserFavorites(@Request() req: AuthenticatedRequest) {
    if (!req.user) {
      return { favorites: [] };
    }

    const user = await this.userService.getUserByAuth0Id(req.user.sub);

    if (!user) {
      return { favorites: [] };
    }

    const favorites = await this.userService.getUserFavorites(user.id);

    return {
      favorites: favorites.map(fav => ({
        id: fav.id,
        recipeId: fav.recipeId,
        createdAt: fav.createdAt,
        recipe: fav.recipe
          ? {
            id: fav.recipe.id,
            title: fav.recipe.title,
            description: fav.recipe.description,
            overview: fav.recipe.overview,
            imageUrl: fav.recipe.imageUrl,
            rating: fav.recipe.rating,
            difficulty: fav.recipe.difficulty,
            totalPrepTime: fav.recipe.totalPrepTime,
            totalCookTime: fav.recipe.totalCookTime,
            servings: fav.recipe.servings,
            tags: fav.recipe.tags,
            author: fav.recipe.author,
            chunks: fav.recipe.chunks || [],
          }
          : null,
      })),
    };
  }

  @Post('me/favorites/:recipeId')
  @HttpCode(HttpStatus.CREATED)
  async addFavorite(
    @Request() req: AuthenticatedRequest,
    @Param('recipeId') recipeId: number,
  ) {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await this.userService.getUserByAuth0Id(req.user.sub);

    if (!user) {
      throw new Error('User not found');
    }

    const favorite = await this.userService.addFavorite(user.id, recipeId);

    return {
      id: favorite.id,
      recipeId: favorite.recipeId,
      createdAt: favorite.createdAt,
    };
  }

  @Delete('me/favorites/:recipeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavorite(
    @Request() req: AuthenticatedRequest,
    @Param('recipeId') recipeId: number,
  ) {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await this.userService.getUserByAuth0Id(req.user.sub);

    if (!user) {
      throw new Error('User not found');
    }

    await this.userService.removeFavorite(user.id, recipeId);
  }

  @Get('me/favorites/:recipeId/status')
  async getFavoriteStatus(
    @Request() req: AuthenticatedRequest,
    @Param('recipeId') recipeId: number,
  ) {
    if (!req.user) {
      return { isFavorite: false };
    }

    const user = await this.userService.getUserByAuth0Id(req.user.sub);

    if (!user) {
      return { isFavorite: false };
    }

    const isFavorite = await this.userService.isFavorite(user.id, recipeId);

    return { isFavorite };
  }
}
