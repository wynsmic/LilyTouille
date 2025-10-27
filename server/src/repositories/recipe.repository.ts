import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Like } from 'typeorm';
import { RecipeEntity } from '../entities/recipe.entity';
import { IRecipeRepository } from './recipe.repository.interface';
import { RecipeFilters } from '../interfaces/recipe.interface';

@Injectable()
export class RecipeRepository implements IRecipeRepository {
  private repository: Repository<RecipeEntity>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(RecipeEntity);
  }

  async findAll(filters?: RecipeFilters): Promise<RecipeEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.chunks', 'chunks')
      .orderBy('chunks.orderIndex', 'ASC');

    if (filters) {
      if (filters.tag) {
        queryBuilder.andWhere('JSON_EXTRACT(recipe.tags, "$") LIKE :tag', {
          tag: `%${filters.tag}%`,
        });
      }

      if (filters.ingredient) {
        queryBuilder.andWhere(
          'JSON_EXTRACT(chunks.ingredients, "$") LIKE :ingredient',
          {
            ingredient: `%${filters.ingredient}%`,
          },
        );
      }

      if (filters.difficulty) {
        queryBuilder.andWhere('recipe.difficulty = :difficulty', {
          difficulty: filters.difficulty,
        });
      }

      if (filters.author) {
        queryBuilder.andWhere('recipe.author LIKE :author', {
          author: `%${filters.author}%`,
        });
      }
    }

    return queryBuilder.getMany();
  }

  async findById(id: number): Promise<RecipeEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['chunks'],
      order: { chunks: { orderIndex: 'ASC' } },
    });
  }

  async findBySourceUrl(sourceUrl: string): Promise<RecipeEntity | null> {
    return this.repository.findOne({ where: { sourceUrl } });
  }

  async save(recipe: Partial<RecipeEntity>): Promise<RecipeEntity> {
    const recipeEntity = this.repository.create(recipe);
    return this.repository.save(recipeEntity);
  }

  async update(
    id: number,
    recipe: Partial<RecipeEntity>,
  ): Promise<RecipeEntity | null> {
    await this.repository.update(id, recipe);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findAllTags(): Promise<string[]> {
    const recipes = await this.repository.find({
      select: ['tags'],
    });

    const allTags = recipes.flatMap(recipe => recipe.tags);
    return [...new Set(allTags)].sort();
  }

  async findAllIngredients(): Promise<string[]> {
    const recipes = await this.repository.find({
      relations: ['chunks'],
    });

    const allIngredients = recipes.flatMap(recipe =>
      recipe.chunks.flatMap(chunk => chunk.ingredients),
    );
    return [...new Set(allIngredients)].sort();
  }

  async findAllAuthors(): Promise<string[]> {
    const recipes = await this.repository.find({
      select: ['author'],
    });

    const allAuthors = recipes.map(recipe => recipe.author);
    return [...new Set(allAuthors)].sort();
  }

  async findByTag(tag: string): Promise<RecipeEntity[]> {
    return this.repository
      .createQueryBuilder('recipe')
      .where('JSON_EXTRACT(recipe.tags, "$") LIKE :tag', { tag: `%${tag}%` })
      .getMany();
  }

  async findByIngredient(ingredient: string): Promise<RecipeEntity[]> {
    return this.repository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.chunks', 'chunks')
      .where('JSON_EXTRACT(chunks.ingredients, "$") LIKE :ingredient', {
        ingredient: `%${ingredient}%`,
      })
      .orderBy('chunks.orderIndex', 'ASC')
      .getMany();
  }

  async findByAuthor(author: string): Promise<RecipeEntity[]> {
    return this.repository.find({
      where: { author: Like(`%${author}%`) },
    });
  }
}
