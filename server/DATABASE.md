# Database Architecture

## Overview

The application uses PostgreSQL as the primary database with TypeORM, implementing the Repository pattern for better data management and scalability.

## Architecture

### Database Layer

- **Database**: PostgreSQL (production-ready, scalable, ACID compliant)
- **ORM**: TypeORM with decorators
- **Connection**: Via `DATABASE_URL` environment variable

### Repository Pattern

- **Interface**: `IRecipeRepository` - defines contract for data access
- **Implementation**: `RecipeRepository` - TypeORM-based implementation
- **Service**: `DatabaseService` - orchestrates database operations and provides migration

### Entity

- **RecipeEntity**: TypeORM entity with proper column mappings
- **Features**: JSON columns for arrays, proper indexing, timestamps

## Key Improvements

### 1. **Production-Ready Database**

- PostgreSQL database for scalability and reliability
- ACID transactions
- Better data integrity and performance

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

- `DATABASE_URL`: PostgreSQL connection string (required)
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
│   ├── recipe.entity.ts          # TypeORM entity
│   └── chunk.entity.ts           # TypeORM entity for recipe chunks
├── repositories/
│   ├── recipe.repository.interface.ts  # Repository contract
│   ├── recipe.repository.ts      # TypeORM implementation
│   └── chunk.repository.ts       # Chunk repository
├── services/
│   ├── database.service.ts       # Database orchestration
│   └── recipe.service.ts         # Business logic
└── scripts/
    ├── migrate-json-to-db.ts     # Migration script
    └── migrate-to-chunks.ts      # Chunk migration script
```

## Benefits

1. **Performance**: PostgreSQL provides excellent query performance and optimization
2. **Scalability**: Can handle large datasets and concurrent users efficiently
3. **Reliability**: ACID transactions ensure data consistency
4. **Maintainability**: Clean architecture with separation of concerns
5. **Testability**: Easy to mock repositories for unit tests
6. **Production-Ready**: PostgreSQL is battle-tested for production environments

## Migration Notes

- Existing JSON data is preserved during migration
- The system maintains backward compatibility
- Workers continue to use the same interface
- No changes required to the API endpoints
