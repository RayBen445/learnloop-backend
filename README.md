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

## Current Status: Phase 7 Complete ✅

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

### Phase 4: Comments ✅
- ✅ Comments CRUD operations
- ✅ Minimum 20 characters validation
- ✅ Post existence validation
- ✅ Hard delete for comments
- ✅ Ownership-based authorization

### Phase 5: Votes and Learning Score ✅
- ✅ Upvote system for posts and comments
- ✅ Prevent duplicate votes and self-voting
- ✅ Learning score auto-updates (+1 on upvote, -1 on removal)
- ✅ Transaction-based score consistency
- ✅ Vote count API with optional auth

### Phase 6: Saved Posts ✅
- ✅ Save/unsave posts for later review
- ✅ List saved posts with pagination
- ✅ Check if post is saved (optional auth)
- ✅ Duplicate save prevention
- ✅ Idempotent unsave operation

### Phase 7: Rate Limiting ✅
- ✅ Authentication rate limiting (5 req/15 min) - brute force protection
- ✅ Post creation rate limiting (10/hour) - spam prevention
- ✅ Comment creation rate limiting (20/hour) - spam prevention
- ✅ Voting rate limiting (60/hour) - manipulation prevention
- ✅ Save/unsave rate limiting (30/hour) - abuse prevention
- ✅ Update/delete rate limiting (30/hour, 20/hour) - abuse prevention
- ✅ Clear 429 responses with retry-after headers
- ✅ No limits on read-only endpoints

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
GET    /api/posts/:postId/comments
GET    /api/posts/topic/:topicId
GET    /api/posts/author/:authorId
PUT    /api/posts/:id (auth required)
DELETE /api/posts/:id (auth required)
```

### Comments
```
POST   /api/comments (auth required)
GET    /api/comments/:id
PUT    /api/comments/:id (auth required)
DELETE /api/comments/:id (auth required)
```

### Votes
```
POST   /api/votes (auth required)
DELETE /api/votes/:id (auth required)
GET    /api/votes/posts/:id (optional auth)
GET    /api/votes/comments/:id (optional auth)
```

### Saved Posts
```
POST   /api/saved-posts (auth required)
GET    /api/saved-posts (auth required)
GET    /api/saved-posts/check/:postId (optional auth)
DELETE /api/saved-posts/:postId (auth required)
```

See [AUTH.md](./AUTH.md) for authentication, [POSTS.md](./POSTS.md) for posts, [COMMENTS.md](./COMMENTS.md) for comments, [VOTES.md](./VOTES.md) for votes, [SAVED_POSTS.md](./SAVED_POSTS.md) for saved posts, and [RATE_LIMITING.md](./RATE_LIMITING.md) for rate limiting documentation.

## Documentation

- **[SETUP.md](./SETUP.md)** - Database setup and Prisma configuration
- **[AUTH.md](./AUTH.md)** - Authentication and authorization guide
- **[POSTS.md](./POSTS.md)** - Topics and Posts API documentation
- **[COMMENTS.md](./COMMENTS.md)** - Comments API documentation
- **[VOTES.md](./VOTES.md)** - Votes and Learning Score API documentation
- **[SAVED_POSTS.md](./SAVED_POSTS.md)** - Saved Posts (Bookmarks) API documentation
- **[RATE_LIMITING.md](./RATE_LIMITING.md)** - Rate Limiting and Abuse Protection
- **[DATABASE_INIT.md](./DATABASE_INIT.md)** - Database initialization details

## Project Structure

```
learnloop-backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js        # Auth logic
│   │   ├── topicsController.js      # Topics logic
│   │   ├── postsController.js       # Posts logic
│   │   ├── commentsController.js    # Comments logic
│   │   ├── votesController.js       # Votes logic
│   │   └── savedPostsController.js  # Saved Posts logic
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   └── rateLimiters.js          # Rate limiting
│   └── routes/
│       ├── authRoutes.js            # Auth endpoints
│       ├── topicsRoutes.js          # Topics endpoints
│       ├── postsRoutes.js           # Posts endpoints
│       ├── commentsRoutes.js        # Comments endpoints
│       ├── votesRoutes.js           # Votes endpoints
│       └── savedPostsRoutes.js      # Saved Posts endpoints
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── migrations/                  # Migration files
├── server.js                        # Express app
├── prisma.js                        # Database client
├── test-auth.js                     # Auth tests
├── test-posts.js                    # Posts tests
└── package.json                     # Dependencies
```

## What's Next

Phase 6 is complete. Future phases will implement:
- User profiles with learning score display
- Feed ranking based on votes
- Leaderboards
- Moderation features
- Admin tools
- Topic management (admin-only)

## License

ISC