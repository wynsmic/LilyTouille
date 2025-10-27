import 'dotenv/config';
import { DatabaseService } from '../services/database.service';
import { readFile } from 'fs/promises';
import path from 'path';
import { RecipeType } from '../workers/types';

async function migrateJsonToDatabase() {
  console.log('Starting migration from JSON to PostgreSQL database...');

  try {
    // Read existing JSON data
    const jsonPath = path.resolve(__dirname, '..', 'data', 'recipes.json');
    const jsonData = await readFile(jsonPath, 'utf-8');
    const recipes: RecipeType[] = JSON.parse(jsonData);

    console.log(`Found ${recipes.length} recipes in JSON file`);

    // Initialize database service
    const db = new DatabaseService();
    await db.initialize();

    // Migrate data
    await db.migrateFromJson(recipes);

    console.log('Migration completed successfully!');
    console.log('You can now safely remove the JSON file if desired.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateJsonToDatabase()
    .then(() => {
      console.log('Migration completed successfully');
    })
    .catch(error => {
      console.error('Migration script failed:', error);
      throw error;
    });
}

export { migrateJsonToDatabase };
