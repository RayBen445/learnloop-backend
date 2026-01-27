# Phase 2: Authentication and Authorization

This document covers the authentication and authorization implementation for LearnLoop backend.

## Overview

Phase 2 implements user authentication using JWT (JSON Web Tokens) and bcrypt for password hashing. This provides secure user registration, login, and protected route access.

## Features Implemented

### 1. User Registration
- **Endpoint**: `POST /api/auth/register`
- **Email validation**: Must be unique and valid format
- **Username validation**: 3-30 characters, alphanumeric + underscores, unique
- **Password validation**: 
  - Minimum 8 characters
  - Rejects common weak passwords (password, 12345678, etc.)
  - Rejects repeated characters (aaaaaaaa)
- **Security**: Passwords hashed with bcrypt (10 rounds)
- **No auto-login**: User must explicitly login after registration

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePassword123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "johndoe",
    "learningScore": 0,
    "createdAt": "2026-01-27T08:00:00.000Z"
  }
}
```

### 2. User Login
- **Endpoint**: `POST /api/auth/login`
- **Authentication**: Email + password
- **Token**: JWT with 7-day expiration (configurable)
- **Payload**: Contains userId only (minimal data)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "johndoe",
    "learningScore": 0
  }
}
```

### 3. Authentication Middleware

Two middleware functions are provided:

#### `requireAuth` - Mandatory Authentication
Protects routes that require authentication. Returns 401 if token is missing or invalid.

**Usage:**
```javascript
import { requireAuth } from './middleware/authMiddleware.js';

router.get('/protected', requireAuth, (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

#### `optionalAuth` - Optional Authentication
Allows both authenticated and anonymous access. Sets `req.user` to null if no valid token.

**Usage:**
```javascript
import { optionalAuth } from './middleware/authMiddleware.js';

router.get('/public', optionalAuth, (req, res) => {
  // req.user may be null or a user object
  if (req.user) {
    res.json({ message: 'Hello ' + req.user.username });
  } else {
    res.json({ message: 'Hello guest' });
  }
});
```

### 4. Authorization Helper

The `isOwner` function helps enforce resource ownership:

```javascript
import { isOwner } from './middleware/authMiddleware.js';

// In a controller
if (!isOwner(req.user.id, post.authorId)) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET="your-secret-key-here-change-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
```

**Important**: 
- Use a strong, random JWT_SECRET in production
- Generate with: `openssl rand -base64 32`
- Never commit actual secrets to version control

## Directory Structure

```
learnloop-backend/
├── src/
│   ├── controllers/
│   │   └── authController.js      # Registration & login logic
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verification & auth helpers
│   └── routes/
│       └── authRoutes.js          # Auth endpoints
├── server.js                      # Express app setup
├── prisma.js                      # Database client
└── test-auth.js                   # Auth endpoint tests
```

## Running the Server

### Development
```bash
npm run dev
```

Starts server with file watching (auto-restart on changes).

### Production
```bash
npm start
```

Starts server normally.

### Testing
```bash
# In one terminal:
npm start

# In another terminal:
node test-auth.js
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and current phase.

### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePassword123"
}
```

### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

### Protected Routes (Future)
```
GET /api/protected
Authorization: Bearer <token>
```

## Error Handling

All endpoints return consistent error responses:

**400 - Bad Request:**
```json
{
  "error": "Email, username, and password are required"
}
```

**401 - Unauthorized:**
```json
{
  "error": "Invalid email or password"
}
```

**409 - Conflict:**
```json
{
  "error": "Email already registered"
}
```

**500 - Internal Server Error:**
```json
{
  "error": "Internal server error during registration"
}
```

## Security Features

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **JWT Tokens**: Signed with secret, 7-day expiration
3. **Input Validation**: Email format, username pattern, password strength
4. **Weak Password Detection**: Common passwords and patterns rejected
5. **Unique Constraints**: Email and username uniqueness enforced at DB level
6. **No Sensitive Data in Tokens**: Only userId in JWT payload
7. **Secure Headers**: Bearer token authentication

## Testing

The `test-auth.js` script validates:
- ✅ Valid registration
- ✅ Weak password rejection
- ✅ Duplicate email/username prevention
- ✅ Valid login
- ✅ Invalid credential rejection
- ✅ Auth middleware (basic check)

## What's NOT Included

Phase 2 is authentication only. The following are NOT implemented:
- ❌ Posts, comments, or topics (Phase 3)
- ❌ Password reset functionality
- ❌ Email verification
- ❌ OAuth/social login
- ❌ Admin roles or permissions
- ❌ Rate limiting
- ❌ CORS configuration (add in deployment)

## Next Steps

Phase 3 will implement:
- Post creation and management
- Comments
- Topics
- Voting system
- Saved posts
- User profiles

## Deployment Notes

When deploying to Render or similar platforms:

1. **Environment Variables**: Set in platform dashboard
   - `DATABASE_URL` (provided by platform)
   - `JWT_SECRET` (generate strong random value)
   - `JWT_EXPIRES_IN` (default: 7d)
   - `PORT` (usually provided by platform)

2. **Build Command**: `npm install && npm run db:migrate`

3. **Start Command**: `npm start`

4. **CORS**: Add CORS middleware for frontend access:
   ```bash
   npm install cors
   ```
   
   In `server.js`:
   ```javascript
   import cors from 'cors';
   app.use(cors());
   ```

## Database Schema

Uses existing User model from Phase 1:
- `id`: UUID (primary key)
- `email`: String (unique)
- `username`: String (unique)
- `hashedPassword`: String (bcrypt hash)
- `learningScore`: Integer (default: 0)
- `createdAt`: DateTime

No schema changes were made in Phase 2.
