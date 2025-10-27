import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { UserFavoriteEntity } from '../entities/user-favorite.entity';

export interface CreateUserDto {
  auth0Id: string;
  email?: string;
  name?: string;
  picture?: string;
  language?: 'en' | 'fr' | 'es' | 'de' | 'it';
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    dietaryRestrictions?: string[];
    cookingSkill?: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface UpdateUserPreferencesDto {
  language?: 'en' | 'fr' | 'es' | 'de' | 'it';
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    dietaryRestrictions?: string[];
    cookingSkill?: 'beginner' | 'intermediate' | 'advanced';
  };
}

// Valid language codes
const VALID_LANGUAGES = ['en', 'fr', 'es', 'de', 'it'];

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserFavoriteEntity)
    private readonly userFavoriteRepository: Repository<UserFavoriteEntity>,
  ) {}

  async findOrCreateUser(auth0Id: string, userData: Partial<CreateUserDto>): Promise<UserEntity> {
    let user = await this.userRepository.findOne({ where: { auth0Id } });

    if (!user) {
      // Create new user
      user = this.userRepository.create({
        auth0Id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        language: userData.language || 'en',
        preferences: userData.preferences || {},
      });
      user = await this.userRepository.save(user);
    } else {
      // Update existing user with latest Auth0 data
      const userId = user.id;
      await this.userRepository.update(userId, {
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
      });
      user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found after update`);
      }
    }

    return user;
  }

  async getUserById(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async getUserByAuth0Id(auth0Id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { auth0Id } });
  }

  async updateUserPreferences(userId: number, preferences: UpdateUserPreferencesDto): Promise<UserEntity> {
    const user = await this.getUserById(userId);

    // Validate language if provided
    let newLanguage = user.language;
    if (preferences.language !== undefined) {
      if (VALID_LANGUAGES.includes(preferences.language)) {
        newLanguage = preferences.language;
      } else {
        throw new ConflictException(`Invalid language code. Supported languages: ${VALID_LANGUAGES.join(', ')}`);
      }
    }

    await this.userRepository.update(userId, {
      language: newLanguage,
      preferences: {
        ...user.preferences,
        ...preferences.preferences,
      },
    });

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with id ${userId} not found after update`);
    }

    return updatedUser;
  }

  async addFavorite(userId: number, recipeId: number): Promise<UserFavoriteEntity> {
    // Check if already favorited
    const existingFavorite = await this.userFavoriteRepository.findOne({
      where: { userId, recipeId },
    });

    if (existingFavorite) {
      throw new ConflictException('Recipe is already in favorites');
    }

    const favorite = this.userFavoriteRepository.create({
      userId,
      recipeId,
    });
    return this.userFavoriteRepository.save(favorite);
  }

  async removeFavorite(userId: number, recipeId: number): Promise<boolean> {
    const result = await this.userFavoriteRepository.delete({
      userId,
      recipeId,
    });
    return (result.affected ?? 0) > 0;
  }

  async getUserFavorites(userId: number): Promise<UserFavoriteEntity[]> {
    return this.userFavoriteRepository.find({
      where: { userId },
      relations: ['recipe'],
      order: { createdAt: 'DESC' },
    });
  }

  async isFavorite(userId: number, recipeId: number): Promise<boolean> {
    const favorite = await this.userFavoriteRepository.findOne({
      where: { userId, recipeId },
    });
    return !!favorite;
  }

  async getFavoriteCount(userId: number): Promise<number> {
    return this.userFavoriteRepository.count({ where: { userId } });
  }
}
