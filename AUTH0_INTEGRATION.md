# Auth0 Integration & User Features

This document describes the implementation of Auth0 authentication and user-specific features in the LaBonneBoubouffe application.

## Overview

The application now supports user authentication through Auth0 and provides personalized features including:

- User profile management
- Favorite recipes
- User preferences (language, theme, notifications, cooking skill level)

## Backend Implementation

### Database Schema

#### User Entity (`UserEntity`)

- `id`: Primary key
- `auth0Id`: Unique Auth0 user identifier
- `email`: User email address
- `name`: User display name
- `picture`: User profile picture URL
- `language`: Preferred language (default: 'en')
- `preferences`: JSON object containing user preferences
- `createdAt`/`updatedAt`: Timestamps

#### User Favorite Entity (`UserFavoriteEntity`)

- `id`: Primary key
- `userId`: Foreign key to User
- `recipeId`: Foreign key to Recipe
- `createdAt`: Timestamp when favorited

### API Endpoints

#### User Management

- `POST /api/users/me` - Create or update user profile
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me/preferences` - Update user preferences

#### Favorites Management

- `GET /api/users/me/favorites` - Get user's favorite recipes
- `POST /api/users/me/favorites/:recipeId` - Add recipe to favorites
- `DELETE /api/users/me/favorites/:recipeId` - Remove recipe from favorites
- `GET /api/users/me/favorites/:recipeId/status` - Check if recipe is favorited

### Authentication Middleware

The `Auth0Middleware` validates JWT tokens from Auth0 and extracts user information:

- Verifies token signature using Auth0 public key
- Validates audience and issuer
- Attaches user info to request object

### Environment Variables

Required environment variables for the server:

```bash
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-auth0-audience
AUTH0_PUBLIC_KEY=your-auth0-public-key
```

## Frontend Implementation

### User Context (`UserContext`)

Provides user data and operations throughout the application:

- User profile information
- Favorites management
- Preferences updates
- Automatic user creation on first login

### User Hooks

#### `useUserFavorites`

Custom hook for managing user favorites:

- `favorites`: Array of favorite recipes
- `addFavorite(recipeId)`: Add recipe to favorites
- `removeFavorite(recipeId)`: Remove recipe from favorites
- `toggleFavorite(recipeId)`: Toggle favorite status
- `isFavorite(recipeId)`: Check if recipe is favorited

### UI Components

#### Enhanced User Profile Dropdown

- Shows user avatar and name
- Displays favorite count
- Links to Favorites page
- Links to Settings page
- Sign out functionality

#### Recipe Card Updates

- Optional favorite button
- Optional delete button
- Configurable button visibility
- Integrated with user favorites system

#### New Pages

##### Favorites Page (`/favorites`)

- Displays all user's favorite recipes
- Empty state with helpful messaging
- Responsive grid layout
- Real-time favorite count updates

##### Settings Page (`/settings`)

- Language selection (EN, FR, ES, DE, IT)
- Theme selection (Light, Dark, Auto)
- Notification preferences
- Cooking skill level
- Real-time preference updates

## Security Considerations

### Authentication

- JWT tokens validated on every request
- Auth0 handles user authentication securely
- No sensitive data stored in frontend

### Authorization

- Users can only access their own data
- Database queries filtered by user ID
- Proper error handling for unauthorized access

### Data Protection

- User preferences stored as JSON in database
- No sensitive information in user preferences
- Proper validation of user input

## Usage Examples

### Adding a Recipe to Favorites

```typescript
const { addFavorite } = useUserFavorites();
await addFavorite(recipeId);
```

### Updating User Preferences

```typescript
const { updatePreferences } = useUser();
await updatePreferences({
  language: "fr",
  preferences: {
    theme: "dark",
    notifications: false,
    cookingSkill: "intermediate",
  },
});
```

### Checking if Recipe is Favorited

```typescript
const { isFavorite } = useUserFavorites();
const favorited = isFavorite(recipeId);
```

## Database Migration

The new entities will be automatically created when the server starts due to TypeORM's `synchronize: true` setting. For production, consider using proper migrations.

## Future Enhancements

Potential future features:

- User recipe collections/categories
- Recipe sharing between users
- User activity tracking
- Personalized recipe recommendations
- Social features (following users, recipe reviews)

## Troubleshooting

### Common Issues

1. **User not created on first login**
   - Check Auth0 configuration
   - Verify JWT token validation
   - Check server logs for errors

2. **Favorites not persisting**
   - Verify database connection
   - Check user authentication
   - Ensure proper API endpoints are called

3. **Preferences not saving**
   - Check validation rules
   - Verify user permissions
   - Check network requests in browser dev tools

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL=debug
```

This will provide detailed information about user operations and API calls.
