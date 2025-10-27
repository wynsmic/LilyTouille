import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserFavoriteEntity } from './user-favorite.entity';

@Entity('users')
@Index(['auth0Id'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn()
    id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
    auth0Id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
    email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
    name?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
    picture?: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
    language: 'en' | 'fr' | 'es' | 'de' | 'it';

  @Column({ type: 'json', nullable: true })
    preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    dietaryRestrictions?: string[];
    cookingSkill?: 'beginner' | 'intermediate' | 'advanced';
  };

  // Relationship to user favorites
  @OneToMany(() => UserFavoriteEntity, favorite => favorite.user, {
    cascade: true,
  })
    favorites: UserFavoriteEntity[];

  @CreateDateColumn()
    createdAt: Date;

  @UpdateDateColumn()
    updatedAt: Date;
}
