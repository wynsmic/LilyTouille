# Database Architecture

## Overview

The application has been upgraded from JSON file storage to a proper SQLite database with TypeORM, implementing the Repository pattern for better data management and scalability.

## Architecture

### Database Layer

- **Database**: SQLite (file-based, lightweight, perfect for this use case)
- **ORM**: TypeORM with decorators
- **Location**: `server/src/data/recipes.db`

### Repository Pattern

- **Interface**: `IRecipeRepository` - defines contract for data access
- **Implementation**: `RecipeRepository` - TypeORM-based implementation
- **Service**: `DatabaseService` - orchestrates database operations and provides migration

### Entity

- **RecipeEntity**: TypeORM entity with proper column mappings
- **Features**: JSON columns for arrays, proper indexing, timestamps

## Key Improvements

### 1. **Proper Data Persistence**

- SQLite database instead of JSON files
- ACID transactions
- Better data integrity

### 2. **Repository Pattern**

- Clean separation of concerns
- Easy to test and mock
- Swappable implementations

### 3. **Type Safety**

- TypeORM entities with decorators
- Compile-time type checking
- Better IDE support

### 4. **Query Optimization**

- Database-level filtering
- Proper indexing
- Efficient JSON queries

### 5. **Migration Support**

- Easy migration from JSON to database
- Data preservation during upgrades

## Usage

### Migration from JSON

```bash
npm run migrate:json
```

### Database Configuration

Environment variables:

- `DB_PATH`: Path to SQLite database file (default: `src/data/recipes.db`)
- `NODE_ENV`: Controls synchronize and logging settings

### Repository Usage

```typescript
// Get repository from DatabaseService
const repository = databaseService.getRecipeRepository();

// Use repository methods
const recipes = await repository.findAll(filters);
const recipe = await repository.findById(1);
await repository.save(newRecipe);
```

## File Structure

```
src/
├── entities/
│   └── recipe.entity.ts          # TypeORM entity
├── repositories/
│   ├── recipe.repository.interface.ts  # Repository contract
│   └── recipe.repository.ts      # TypeORM implementation
├── services/
│   ├── database.service.ts       # Database orchestration
│   └── recipe.service.ts         # Business logic
└── scripts/
    └── migrate-json-to-db.ts     # Migration script
```

## Benefits

1. **Performance**: Database queries are faster than JSON parsing
2. **Scalability**: Can handle larger datasets efficiently
3. **Reliability**: ACID transactions ensure data consistency
4. **Maintainability**: Clean architecture with separation of concerns
5. **Testability**: Easy to mock repositories for unit tests
6. **Future-proof**: Easy to migrate to PostgreSQL/MySQL if needed

## Migration Notes

- Existing JSON data is preserved during migration
- The system maintains backward compatibility
- Workers continue to use the same interface
- No changes required to the API endpoints
