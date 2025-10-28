import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChunkEntity } from './chunk.entity';

@Entity('recipes')
export class RecipeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'json' })
  overview: string[];

  @Column({ type: 'int', default: 0 })
  totalPrepTime: number;

  @Column({ type: 'int', default: 0 })
  totalCookTime: number;

  @Column({ type: 'int', default: 1 })
  servings: number;

  @Column({ type: 'varchar', length: 20, default: 'easy' })
  difficulty: 'easy' | 'medium' | 'hard';

  @Column({ type: 'json' })
  tags: string[];

  @Column({ type: 'varchar', length: 500 })
  imageUrl: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'varchar', length: 255 })
  author: string;

  // Auth ownership (internal user id linkage only)

  // Relationship to chunks
  @OneToMany(() => ChunkEntity, chunk => chunk.recipe, { cascade: true })
  chunks: ChunkEntity[];

  // Scraping metadata
  @Column({ type: 'varchar', length: 1000, nullable: true })
  sourceUrl?: string;

  @Column({ type: 'text', nullable: true })
  scrapedHtml?: string;

  @Column({ type: 'text', nullable: true })
  advancedCleanedHtml?: string;

  @Column({ type: 'text', nullable: true })
  aiQuery?: string;

  @Column({ type: 'text', nullable: true })
  aiResponse?: string;

  @Column({ type: 'json', nullable: true })
  urlMappings?: { [shortCode: string]: string };

  @Column({ type: 'timestamp', nullable: true })
  scrapedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Validation status
  @Column({ type: 'timestamp', nullable: true })
  validatedAt?: Date;

  // Owner linkage: internal user id
  @Column({ type: 'int', nullable: true })
  ownerUserId?: number;
}
