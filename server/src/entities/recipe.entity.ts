import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('recipes')
export class RecipeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'json' })
  ingredients: string[];

  @Column({ type: 'json' })
  overview: string[];

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

  @Column({ type: 'varchar', length: 500 })
  imageUrl: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'varchar', length: 255 })
  author: string;

  // Chunked recipe support
  @Column({ type: 'json', nullable: true })
  parts?: Array<{
    title: string;
    description?: string;
    ingredients: string[];
    recipeSteps: Array<{
      type: 'text' | 'image';
      content: string;
      imageUrl?: string;
    }>;
    prepTime?: number;
    cookTime?: number;
  }>;

  @Column({ type: 'boolean', default: false })
  isChunked: boolean;

  // Scraping metadata
  @Column({ type: 'varchar', length: 1000, nullable: true })
  sourceUrl?: string;

  @Column({ type: 'text', nullable: true })
  scrapedHtml?: string;

  @Column({ type: 'text', nullable: true })
  aiQuery?: string;

  @Column({ type: 'text', nullable: true })
  aiResponse?: string;

  @Column({ type: 'json', nullable: true })
  urlMappings?: { [shortCode: string]: string };

  @Column({ type: 'datetime', nullable: true })
  scrapedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
