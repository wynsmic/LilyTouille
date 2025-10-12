# LaBonneBoubouffe NestJS API Server

A modern TypeScript API server built with NestJS framework for managing recipes with clean architecture and dependency injection.

## Features

- **NestJS Framework**: Modern, scalable Node.js framework
- **Clean Architecture**: Module → Controller → Service pattern with dependency injection
- **TypeScript**: Full type safety and modern JavaScript features
- **Validation**: Automatic request validation with class-validator
- **CORS**: Cross-origin resource sharing enabled
- **Global Prefix**: All routes prefixed with `/api`
- **Error Handling**: Built-in exception filters and HTTP status codes
- **Hot Reload**: Development server with nodemon

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
cd server
npm install
```

### Development

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Base URL

```
http://localhost:5000/api
```

### Endpoints

#### Get All Recipes

```http
GET /api/recipes
```

**Query Parameters:**

- `tag` - Filter by tag (e.g., `?tag=pasta`)
- `ingredient` - Filter by ingredient (e.g., `?ingredient=chicken`)
- `difficulty` - Filter by difficulty (easy, medium, hard)
- `author` - Filter by author name

**Example:**

```bash
curl "http://localhost:5000/api/recipes?tag=italian&difficulty=medium"
```

#### Get Recipe by ID

```http
GET /api/recipes/:id
```

**Example:**

```bash
curl http://localhost:5000/api/recipes/1
```

#### Get All Tags

```http
GET /api/recipes/tags
```

#### Get All Ingredients

```http
GET /api/recipes/ingredients
```

#### Get All Authors

```http
GET /api/recipes/authors
```

#### Health Check

```http
GET /api/health
```

### Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": [...],
  "count": 5,
  "filters": {
    "tag": "pasta"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Project Structure

```
src/
├── controllers/     # Request handlers with decorators
├── services/         # Business logic with dependency injection
├── modules/          # Feature modules
├── dto/              # Data Transfer Objects with validation
├── interfaces/       # TypeScript interfaces
├── data/             # JSON data files
├── app.module.ts     # Root module
└── main.ts           # Application bootstrap
```

## NestJS Features Used

- **Controllers**: Handle HTTP requests with decorators (`@Get`, `@Post`, etc.)
- **Services**: Business logic with `@Injectable()` decorator
- **Modules**: Organize application with `@Module()` decorator
- **DTOs**: Data validation with class-validator decorators
- **Dependency Injection**: Automatic service injection
- **Pipes**: Request transformation and validation
- **Exception Filters**: Global error handling

## Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
NODE_ENV=development
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run start:prod` - Start production server (alias)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Dependencies

### Core NestJS

- `@nestjs/core` - Core NestJS framework
- `@nestjs/common` - Common utilities and decorators
- `@nestjs/platform-express` - Express platform adapter

### Validation

- `class-validator` - Decorator-based validation
- `class-transformer` - Object transformation

### Development

- `@nestjs/cli` - NestJS CLI tools
- `reflect-metadata` - Metadata reflection
- `rxjs` - Reactive programming
