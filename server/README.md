# LaBonneBoubouffe API Server

A TypeScript Express API server for managing recipes with clean architecture.

## Features

- **Clean Architecture**: Model → Service → Controller pattern
- **TypeScript**: Full type safety and modern JavaScript features
- **Express**: Fast, unopinionated web framework
- **CORS**: Cross-origin resource sharing enabled
- **Helmet**: Security headers
- **Morgan**: HTTP request logger
- **Dotenv**: Environment variable management
- **Nodemon**: Development server with hot reload

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
http://localhost:5000/api/recipes
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
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Type definitions
├── routes/          # Route definitions
├── data/            # JSON data files
└── index.ts         # Server entry point
```

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
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
