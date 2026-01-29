# LearnLoop Backend - Setup Instructions

## Phase 1: Database Design and Prisma Setup

This document provides instructions for setting up the database using Prisma ORM with PostgreSQL.

## Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL database (local or cloud)
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `prisma` (dev dependency) - Prisma CLI for migrations and schema management
- `@prisma/client` - Prisma Client for database queries
- `pg` - PostgreSQL client for Node.js
- `@prisma/adapter-pg` - Prisma adapter for PostgreSQL (required in Prisma 7+)
- `dotenv` - Environment variable management

### 2. Configure Database Connection

The database connection is configured via the `DATABASE_URL` environment variable.

**For local development**, create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/learnloop?schema=public"
```

Replace with your actual PostgreSQL connection string:
- `username` - Your PostgreSQL username
- `password` - Your PostgreSQL password
- `localhost:5432` - Your PostgreSQL host and port
- `learnloop` - Your database name

**For deployment (e.g., Render)**, the `DATABASE_URL` will be automatically provided by the platform.

### 3. Validate Prisma Setup

Ensure the Prisma schema is valid and Prisma Client is properly generated:

```bash
npm run db:validate
```

This will verify:
- Prisma Client can be imported
- All models are accessible
- Required methods are available

### 4. Apply Database Migrations

**For production/deployment:**

```bash
npm run db:migrate
```

This runs `prisma migrate deploy` which applies all pending migrations without prompting.

**For local development:**

```bash
npm run db:migrate:dev
```

This runs `prisma migrate dev` which:
- Creates a new migration if schema changed
- Applies all pending migrations
- Regenerates Prisma Client

### 5. (Optional) Generate Prisma Client

If you need to regenerate the Prisma Client without running migrations:

```bash
npm run db:generate
```

## Database Schema Overview

### Models

1. **User** - User accounts with authentication
   - UUID primary key for security
   - Unique email and username
   - Learning score for gamification
   - Relations: posts, comments, savedPosts, votes

2. **Topic** - Subject categories for posts
   - Auto-incrementing integer ID
   - Unique name constraint
   - Relations: posts

3. **Post** - User-generated learning content
   - Title (max 60 characters)
   - Content (80-220 words enforced at API layer)
   - Soft delete support via `deletedAt` field
   - Exactly ONE primary topic
   - Relations: author, primaryTopic, comments, savedBy, votes

4. **Comment** - User comments on posts
   - Minimum 20 characters (enforced at API layer)
   - Relations: author, post, votes

5. **SavedPost** - User bookmarks
   - Composite primary key (userId, postId)
   - Prevents duplicate saves

6. **Vote** - Upvote system
   - Supports votes on posts OR comments
   - Unique constraints prevent duplicate votes
   - Only UPVOTE type in current phase

## Using Prisma Client in Your Code

The Prisma Client is pre-configured and ready to import. Use it in your application code:

```javascript
import prisma from './prisma.js';

// Example: Fetch all users
const users = await prisma.user.findMany();

// Example: Create a new topic
const topic = await prisma.topic.create({
  data: {
    name: 'Mathematics',
    description: 'All things math related'
  }
});

// Always disconnect when done (e.g., in cleanup handlers)
await prisma.$disconnect();
```

**Note:** Prisma 7+ uses an adapter pattern for database connections. The `prisma.js` file in the project root is already configured with the PostgreSQL adapter.

## Migration Files

The initial migration has been created in `prisma/migrations/`. This migration contains:
- All table definitions (users, topics, posts, comments, saved_posts, votes)
- All indexes for query optimization
- All foreign key constraints and relations
- The VoteType enum (UPVOTE)

When deploying, migrations will be automatically applied using `npm run db:migrate`.

## Useful Commands

### View Database in Prisma Studio

```bash
npx prisma studio
```

Opens a web interface to view and edit database data.

### Reset Database

**WARNING: This will delete all data!**

```bash
npx prisma migrate reset
```

### Check Migration Status

```bash
npx prisma migrate status
```

### Format Schema File

```bash
npx prisma format
```

## Database Constraints

The schema enforces data integrity through:

- **Foreign Keys**: All relations use proper FK constraints
- **Unique Constraints**: Prevent duplicate emails, usernames, topic names, and votes
- **Cascade Deletes**: User deletion cascades to their posts, comments, votes, and saves
- **Restrict Deletes**: Cannot delete topics that have posts
- **Indexes**: Optimized for common queries (email, username, authorId, topicId, etc.)

### Important Notes on Vote Model

The Vote model allows users to vote on either posts OR comments:
- Exactly one of `postId` or `commentId` must be non-null (enforced at API layer in future phases)
- Unique constraints prevent duplicate votes on the same post or comment
- PostgreSQL treats NULL values as distinct, so the constraints work correctly

### Prisma 7+ Configuration

This project uses Prisma 7+, which has moved database connection configuration from `schema.prisma` to `prisma.config.ts`. The datasource URL is read from the `DATABASE_URL` environment variable in `prisma.config.ts`, not in the schema file.

## Next Steps

Phase 1 is complete. The following are NOT implemented yet:
- API routes and controllers
- Authentication middleware
- Business logic for content validation (word count, character limits)
- Frontend/UI

These will be addressed in future phases.

## Troubleshooting

### Migration Issues

If migrations fail:
1. Check your database connection string in `.env`
2. Ensure PostgreSQL is running
3. Verify database user has proper permissions
4. Check migration logs in `prisma/migrations/`

### Schema Changes

After modifying `prisma/schema.prisma`:
1. Run `npx prisma format` to validate
2. Run `npx prisma migrate dev --name descriptive_name` to create migration
3. Migration will automatically regenerate Prisma Client

## Notes

- This is a Phase 1 implementation focusing on database design only
- Content validation (word counts, character limits) will be enforced at the API layer in future phases
- The platform intentionally does NOT use AI for content generation or assistance
- All rules are enforced at database and API level, not just frontend

## CORS Configuration for Deployment

### Overview

The backend includes production-ready CORS (Cross-Origin Resource Sharing) configuration that allows:
- All Vercel preview deployments (https://*.vercel.app)
- Localhost for local development
- Custom production domains via environment variable
- Proper security for cross-origin requests

### Environment Variables

Add these to your deployment platform's environment variables:

```env
# Required for production security
NODE_ENV="production"

# Optional: Add custom domains that need access to your API
# Comma-separated list of allowed origins
ALLOWED_ORIGINS="https://app.example.com,https://www.example.com"
```

### How CORS Works in This Project

**Development Mode (NODE_ENV not set or = "development"):**
- ✅ Allows all Vercel deployments (https://*.vercel.app)
- ✅ Allows localhost (http://localhost:*, http://127.0.0.1:*)
- ✅ Allows requests with no origin (Postman, curl, server-to-server, etc.)

**Production Mode (NODE_ENV = "production"):**
- ✅ Allows all Vercel deployments (https://*.vercel.app)
- ✅ Allows custom domains from ALLOWED_ORIGINS
- ✅ Allows requests with no origin header (server-to-server, curl, etc.)
- ❌ Blocks localhost origins (security)
- ❌ Requires HTTPS for all origins (except localhost in dev)
- 🔍 Logs rejected requests with disallowed origins for security monitoring

### Vercel Deployment

When deploying your Next.js frontend to Vercel:
1. No code changes needed - all *.vercel.app domains are automatically allowed
2. Preview deployments work out of the box
3. Production deployment works automatically

### Custom Domain

If using a custom domain (e.g., app.example.com):
1. Set `ALLOWED_ORIGINS` environment variable on your backend deployment
2. Add your domain: `ALLOWED_ORIGINS="https://app.example.com"`
3. For multiple domains: `ALLOWED_ORIGINS="https://app.example.com,https://www.example.com"`

### Security Features

- **HTTPS Enforcement**: Production origins must use HTTPS (except localhost in dev)
- **Dynamic Origin Validation**: Origins are validated against patterns, not hardcoded
- **Credentials Support**: Allows cookies and Authorization headers
- **Preflight Caching**: OPTIONS requests are cached for 24 hours (performance)
- **Environment Awareness**: Different security policies for dev vs production

### Testing CORS

Test your CORS configuration locally:

```bash
# Test with Vercel origin
curl -i http://localhost:3000/health \
  -H "Origin: https://myapp.vercel.app"

# Test with localhost origin
curl -i http://localhost:3000/health \
  -H "Origin: http://localhost:3000"

# Test OPTIONS preflight request
curl -i -X OPTIONS http://localhost:3000/api/auth/register \
  -H "Origin: https://myapp.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

Expected headers in response:
- `Access-Control-Allow-Origin: <your-origin>`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type,Authorization`
- `Access-Control-Max-Age: 86400` (for OPTIONS requests)
