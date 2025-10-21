import { Repository } from 'typeorm';
import { ChunkEntity } from '../entities/chunk.entity';
import { RecipeEntity } from '../entities/recipe.entity';

export interface IChunkRepository {
  findAll(): Promise<ChunkEntity[]>;
  findById(id: number): Promise<ChunkEntity | null>;
  findByRecipeId(recipeId: number): Promise<ChunkEntity[]>;
  save(chunk: Partial<ChunkEntity>): Promise<ChunkEntity>;
  update(id: number, chunk: Partial<ChunkEntity>): Promise<ChunkEntity | null>;
  delete(id: number): Promise<boolean>;
  deleteByRecipeId(recipeId: number): Promise<boolean>;
}

export class ChunkRepository implements IChunkRepository {
  constructor(private repository: Repository<ChunkEntity>) {}

  async findAll(): Promise<ChunkEntity[]> {
    return this.repository.find({
      relations: ['recipe'],
      order: { orderIndex: 'ASC' },
    });
  }

  async findById(id: number): Promise<ChunkEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['recipe'],
    });
  }

  async findByRecipeId(recipeId: number): Promise<ChunkEntity[]> {
    return this.repository.find({
      where: { recipeId },
      relations: ['recipe'],
      order: { orderIndex: 'ASC' },
    });
  }

  async save(chunk: Partial<ChunkEntity>): Promise<ChunkEntity> {
    return this.repository.save(chunk);
  }

  async update(
    id: number,
    chunk: Partial<ChunkEntity>
  ): Promise<ChunkEntity | null> {
    await this.repository.update(id, chunk);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (
      result.affected !== undefined &&
      result.affected !== null &&
      result.affected > 0
    );
  }

  async deleteByRecipeId(recipeId: number): Promise<boolean> {
    const result = await this.repository.delete({ recipeId });
    return (
      result.affected !== undefined &&
      result.affected !== null &&
      result.affected > 0
    );
  }
}
