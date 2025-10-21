import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export class RecipeStepDto {
  @IsIn(['text', 'image'])
  type: 'text' | 'image';

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class ChunkDto {
  @IsNumber()
  id: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  ingredients: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeStepDto)
  recipeSteps: RecipeStepDto[];

  @IsNumber()
  prepTime: number;

  @IsNumber()
  cookTime: number;

  @IsNumber()
  servings: number;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsNumber()
  rating: number;

  @IsNumber()
  orderIndex: number;

  @IsNumber()
  recipeId: number;
}

export class RecipeDto {
  @IsNumber()
  id: number;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  overview: string[];

  @IsNumber()
  totalPrepTime: number;

  @IsNumber()
  totalCookTime: number;

  @IsNumber()
  servings: number;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  imageUrl: string;

  @IsNumber()
  rating: number;

  @IsString()
  author: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChunkDto)
  chunks: ChunkDto[];

  // Scraping metadata (optional)
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  scrapedHtml?: string;

  @IsOptional()
  @IsString()
  aiQuery?: string;

  @IsOptional()
  @IsString()
  aiResponse?: string;

  @IsOptional()
  @IsString()
  scrapedAt?: string;
}

export class CreateChunkDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  ingredients: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeStepDto)
  recipeSteps: RecipeStepDto[];

  @IsNumber()
  prepTime: number;

  @IsNumber()
  cookTime: number;

  @IsNumber()
  servings: number;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsNumber()
  rating: number;

  @IsNumber()
  orderIndex: number;

  @IsNumber()
  recipeId: number;
}

export class CreateRecipeDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  overview: string[];

  @IsNumber()
  totalPrepTime: number;

  @IsNumber()
  totalCookTime: number;

  @IsNumber()
  servings: number;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  imageUrl: string;

  @IsNumber()
  rating: number;

  @IsString()
  author: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChunkDto)
  chunks: CreateChunkDto[];

  // Scraping metadata (optional)
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  scrapedHtml?: string;

  @IsOptional()
  @IsString()
  aiQuery?: string;

  @IsOptional()
  @IsString()
  aiResponse?: string;

  @IsOptional()
  @IsString()
  scrapedAt?: string;
}

export class RecipeFiltersDto {
  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  ingredient?: string;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsString()
  author?: string;
}
