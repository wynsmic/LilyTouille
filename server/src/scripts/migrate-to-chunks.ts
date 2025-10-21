import { DataSource } from 'typeorm';
import { config } from '../config';
import { RecipeEntity } from '../entities/recipe.entity';
import { ChunkEntity } from '../entities/chunk.entity';

/**
 * Migration script to convert existing recipes from the old structure to the new chunk-based structure
 *
 * This script will:
 * 1. Read existing recipes from the database
 * 2. Convert recipes with parts to the new chunk structure
 * 3. Convert recipes without parts to a single chunk
 * 4. Update the database with the new structure
 */

async function migrateRecipesToChunks() {
  console.log('🚀 Starting recipe migration to chunk structure...');

  // Initialize database connection
  const dataSource = new DataSource({
    type: 'sqlite',
    database: config.db.database,
    synchronize: false, // Don't auto-sync during migration
    logging: true,
    entities: [RecipeEntity, ChunkEntity],
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const recipeRepository = dataSource.getRepository(RecipeEntity);
    const chunkRepository = dataSource.getRepository(ChunkEntity);

    // Get all existing recipes
    const existingRecipes = await recipeRepository.find();
    console.log(`📊 Found ${existingRecipes.length} recipes to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const recipe of existingRecipes) {
      try {
        console.log(`🔄 Migrating recipe: ${recipe.title} (ID: ${recipe.id})`);

        // Check if this recipe already has chunks (already migrated)
        const existingChunks = await chunkRepository.find({
          where: { recipeId: recipe.id },
        });
        if (existingChunks.length > 0) {
          console.log(`⏭️  Recipe ${recipe.id} already has chunks, skipping`);
          skippedCount++;
          continue;
        }

        // Convert recipe to new structure
        const newRecipeData: Partial<RecipeEntity> = {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          overview: recipe.overview,
          totalPrepTime: recipe.totalPrepTime || 0,
          totalCookTime: recipe.totalCookTime || 0,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          tags: recipe.tags,
          imageUrl: recipe.imageUrl,
          rating: recipe.rating,
          author: recipe.author,
          sourceUrl: recipe.sourceUrl,
          scrapedHtml: recipe.scrapedHtml,
          aiQuery: recipe.aiQuery,
          aiResponse: recipe.aiResponse,
          urlMappings: recipe.urlMappings,
          scrapedAt: recipe.scrapedAt,
        };

        // Update the recipe entity
        await recipeRepository.update(recipe.id, newRecipeData);

        // Create chunks based on existing structure
        if ((recipe as any).parts && (recipe as any).parts.length > 0) {
          // Recipe has parts - convert each part to a chunk
          console.log(
            `📝 Converting ${(recipe as any).parts.length} parts to chunks`
          );

          for (let i = 0; i < (recipe as any).parts.length; i++) {
            const part = (recipe as any).parts[i];
            const chunkData: Partial<ChunkEntity> = {
              title: part.title,
              description: part.description,
              ingredients: part.ingredients,
              recipeSteps: part.recipeSteps,
              prepTime: part.prepTime || 0,
              cookTime: part.cookTime || 0,
              servings: recipe.servings,
              difficulty: recipe.difficulty,
              tags: recipe.tags,
              imageUrl: recipe.imageUrl,
              rating: recipe.rating,
              orderIndex: i,
              recipeId: recipe.id,
            };

            await chunkRepository.save(chunkData);
          }
        } else {
          // Recipe doesn't have parts - create a single chunk from the recipe data
          console.log(`📝 Creating single chunk from recipe data`);

          const chunkData: Partial<ChunkEntity> = {
            title: recipe.title,
            description: recipe.description,
            ingredients: (recipe as any).ingredients || [],
            recipeSteps: (recipe as any).recipeSteps || [],
            prepTime: (recipe as any).prepTime || 0,
            cookTime: (recipe as any).cookTime || 0,
            servings: recipe.servings,
            difficulty: recipe.difficulty,
            tags: recipe.tags,
            imageUrl: recipe.imageUrl,
            rating: recipe.rating,
            orderIndex: 0,
            recipeId: recipe.id,
          };

          await chunkRepository.save(chunkData);
        }

        migratedCount++;
        console.log(`✅ Successfully migrated recipe ${recipe.id}`);
      } catch (error) {
        console.error(`❌ Error migrating recipe ${recipe.id}:`, error);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Statistics:`);
    console.log(`   - Migrated: ${migratedCount} recipes`);
    console.log(`   - Skipped: ${skippedCount} recipes`);
    console.log(
      `   - Total processed: ${migratedCount + skippedCount} recipes`
    );
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateRecipesToChunks()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateRecipesToChunks };
