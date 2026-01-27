# learnloop-backend

Backend for LearnLoop - A human-first learning social app for students.

## Core Philosophy

This platform is intentionally human-first and does NOT use AI to generate, suggest, summarize, or assist with content. Learning is demonstrated through short written explanations by users.

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: Email + password with JWT

## Current Status: Phase 3 Complete ✅

### Phase 1: Database Design ✅
- ✅ Database schema design
- ✅ Prisma ORM setup
- ✅ All data models with proper relations, constraints, and indexes
- ✅ Migration files ready for deployment

### Phase 2: Authentication ✅
- ✅ User registration with validation
- ✅ User login with JWT tokens
- ✅ Password hashing with bcrypt
- ✅ Auth middleware for protected routes
- ✅ Authorization helpers

### Phase 3: Topics and Posts ✅
- ✅ Topics API (read-only)
- ✅ Posts CRUD with strict validation
- ✅ Word count enforcement (80-220 words)
- ✅ Soft delete for posts
- ✅ Ownership-based authorization

### Database Models
1. **User** - User accounts with UUID, email, username, and learning score
2. **Topic** - Subject categories for organizing posts
3. **Post** - User-generated learning content with soft delete support
4. **Comment** - User comments on posts
5. **SavedPost** - User bookmarks with composite primary key
6. **Vote** - Upvote-only system for posts and comments

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and configure:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/learnloop?schema=public"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"
PORT=3000
```

### 3. Setup Database
```bash
# Run migrations
npm run db:migrate:dev

# Or for production
npm run db:migrate
```

### 4. Start Server
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

### 5. Test API
```bash
# In another terminal

# Test authentication
node test-auth.js

# Test topics and posts
node test-posts.js
```

## API Endpoints

### Health Check
```
GET /health
```

### Authentication
```
POST /api/auth/register
POST /api/auth/login
```

### Topics
```
GET /api/topics
GET /api/topics/:id
GET /api/topics/by-name/:name
```

### Posts
```
POST   /api/posts (auth required)
GET    /api/posts
GET    /api/posts/:id
GET    /api/posts/topic/:topicId
GET    /api/posts/author/:authorId
PUT    /api/posts/:id (auth required)
DELETE /api/posts/:id (auth required)
```

See [AUTH.md](./AUTH.md) for authentication documentation and [POSTS.md](./POSTS.md) for posts documentation.

## Documentation

- **[SETUP.md](./SETUP.md)** - Database setup and Prisma configuration
- **[AUTH.md](./AUTH.md)** - Authentication and authorization guide
- **[POSTS.md](./POSTS.md)** - Topics and Posts API documentation
- **[DATABASE_INIT.md](./DATABASE_INIT.md)** - Database initialization details

## Project Structure

```
learnloop-backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js       # Auth logic
│   │   ├── topicsController.js     # Topics logic
│   │   └── postsController.js      # Posts logic
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT verification
│   └── routes/
│       ├── authRoutes.js           # Auth endpoints
│       ├── topicsRoutes.js         # Topics endpoints
│       └── postsRoutes.js          # Posts endpoints
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── migrations/                 # Migration files
├── server.js                       # Express app
├── prisma.js                       # Database client
├── test-auth.js                    # Auth tests
├── test-posts.js                   # Posts tests
└── package.json                    # Dependencies
```

## What's Next

Phase 3 is complete. Future phases will implement:
- Comments system
- Voting functionality (upvotes only)
- Saved posts
- User profiles
- Feed ranking
- Moderation features

## License

ISC