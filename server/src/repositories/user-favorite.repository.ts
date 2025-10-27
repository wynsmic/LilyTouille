import { Repository, DataSource } from 'typeorm';
import { UserFavoriteEntity } from '../entities/user-favorite.entity';

export interface IUserFavoriteRepository {
  findByUserId(userId: number): Promise<UserFavoriteEntity[]>;
  findByUserIdAndRecipeId(
    userId: number,
    recipeId: number
  ): Promise<UserFavoriteEntity | null>;
  save(favorite: Partial<UserFavoriteEntity>): Promise<UserFavoriteEntity>;
  deleteByUserIdAndRecipeId(userId: number, recipeId: number): Promise<boolean>;
  deleteByUserId(userId: number): Promise<boolean>;
  countByUserId(userId: number): Promise<number>;
}

export class UserFavoriteRepository implements IUserFavoriteRepository {
  private repository: Repository<UserFavoriteEntity>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(UserFavoriteEntity);
  }

  async findByUserId(userId: number): Promise<UserFavoriteEntity[]> {
    return this.repository.find({
      where: { userId },
      relations: ['recipe'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserIdAndRecipeId(
    userId: number,
    recipeId: number,
  ): Promise<UserFavoriteEntity | null> {
    return this.repository.findOne({
      where: { userId, recipeId },
      relations: ['recipe'],
    });
  }

  async save(
    favorite: Partial<UserFavoriteEntity>,
  ): Promise<UserFavoriteEntity> {
    const favoriteEntity = this.repository.create(favorite);
    return this.repository.save(favoriteEntity);
  }

  async deleteByUserIdAndRecipeId(
    userId: number,
    recipeId: number,
  ): Promise<boolean> {
    const result = await this.repository.delete({ userId, recipeId });
    return (result.affected ?? 0) > 0;
  }

  async deleteByUserId(userId: number): Promise<boolean> {
    const result = await this.repository.delete({ userId });
    return (result.affected ?? 0) > 0;
  }

  async countByUserId(userId: number): Promise<number> {
    return this.repository.count({ where: { userId } });
  }
}
