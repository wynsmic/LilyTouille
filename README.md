# LaBonneBoubouffe

A monorepo project with client and server packages.

## Structure

- `client/` - React + Vite + TypeScript frontend application
- `server/` - Node.js + Express + TypeScript backend API

## Getting Started

### Development

Run both client and server in development mode:

```bash
# Install dependencies for all packages
npm install

# Run client development server
npm run dev:client

# Run server development server
npm run dev:server
```

### Individual Package Commands

```bash
# Client commands
cd client
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build

# Server commands
cd server
npm run dev      # Start with nodemon
npm run build    # Build TypeScript
npm start        # Start production server
```

## Tech Stack

### Client
- React 18
- Vite
- TypeScript
- ESLint + Prettier

### Server
- Node.js
- Express
- TypeScript
- ESLint + Prettier
