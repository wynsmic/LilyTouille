import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { RecipeEntity } from './recipe.entity';

@Entity('user_favorites')
@Index(['userId', 'recipeId'], { unique: true })
export class UserFavoriteEntity {
  @PrimaryGeneratedColumn()
    id: number;

  @Column({ type: 'int' })
    userId: number;

  @Column({ type: 'int' })
    recipeId: number;

  @ManyToOne(() => UserEntity, user => user.favorites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
    user: UserEntity;

  @ManyToOne(() => RecipeEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipeId' })
    recipe: RecipeEntity;

  @CreateDateColumn()
    createdAt: Date;
}
