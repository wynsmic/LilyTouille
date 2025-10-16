# LilyTouille

A monorepo project with client and server packages.

## Structure

- `client/` - React + Vite + TypeScript frontend application
- `server/` - Node.js + Express + TypeScript backend API

## Getting Started

### Auth0 Setup

The application uses Auth0 for authentication. To set up Auth0:

1. Create an Auth0 account and application at [auth0.com](https://auth0.com)
2. Create a `.env` file in the `client/` directory with the following variables:
   ```
   VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your-auth0-client-id
   ```
3. Configure your Auth0 application:
   - Set the **Allowed Callback URLs** to: `http://localhost:5173`
   - Set the **Allowed Logout URLs** to: `http://localhost:5173`
   - Set the **Allowed Web Origins** to: `http://localhost:5173`

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
- Auth0 React SDK
- ESLint + Prettier

### Server

- Node.js
- Express
- TypeScript
- ESLint + Prettier
