import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RecipeEntity } from './recipe.entity';

@Entity('chunks')
export class ChunkEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json' })
  ingredients: string[];

  @Column({ type: 'json' })
  recipeSteps: Array<{
    type: 'text' | 'image';
    content: string;
    imageUrl?: string;
  }>;

  @Column({ type: 'int', default: 0 })
  prepTime: number;

  @Column({ type: 'int', default: 0 })
  cookTime: number;

  @Column({ type: 'int', default: 1 })
  servings: number;

  @Column({ type: 'varchar', length: 20, default: 'easy' })
  difficulty: 'easy' | 'medium' | 'hard';

  @Column({ type: 'json' })
  tags: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  // Foreign key to recipe
  @Column({ type: 'int' })
  recipeId: number;

  @ManyToOne(() => RecipeEntity, recipe => recipe.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipeId' })
  recipe: RecipeEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
