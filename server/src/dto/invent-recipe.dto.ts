import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum RecipeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum RecipeCuisine {
  FRENCH = 'french',
  ITALIAN = 'italian',
  ASIAN = 'asian',
  MEXICAN = 'mexican',
  MEDITERRANEAN = 'mediterranean',
  AMERICAN = 'american',
  INDIAN = 'indian',
  JAPANESE = 'japanese',
  THAI = 'thai',
  CHINESE = 'chinese',
  OTHER = 'other',
}

export enum RecipeType {
  APPETIZER = 'appetizer',
  MAIN_COURSE = 'main_course',
  DESSERT = 'dessert',
  SIDE_DISH = 'side_dish',
  SOUP = 'soup',
  SALAD = 'salad',
  BREAKFAST = 'breakfast',
  SNACK = 'snack',
  BEVERAGE = 'beverage',
}

export class InventRecipeDto {
  @IsString()
    title!: string;

  @IsOptional()
  @IsString()
    description?: string;

  @IsOptional()
  @IsEnum(RecipeCuisine)
    cuisine?: RecipeCuisine;

  @IsOptional()
  @IsEnum(RecipeType)
    type?: RecipeType;

  @IsOptional()
  @IsEnum(RecipeDifficulty)
    difficulty?: RecipeDifficulty;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
    servings?: number;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(300)
    prepTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(480)
    cookTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
    ingredients?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
    dietaryRestrictions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
    cookingMethods?: string[];

  @IsOptional()
  @IsString()
    specialInstructions?: string;
}
