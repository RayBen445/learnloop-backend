# Phase 3: Topics and Posts API

This document covers the Topics and Posts implementation for LearnLoop backend.

## Overview

Phase 3 implements read-only Topics endpoints and full CRUD for Posts with strict content validation. Posts must be 80-220 words and belong to exactly one topic.

## Topics API

Topics are predefined categories for organizing posts. Topic creation is read-only for now (admin functionality to be added later).

### Endpoints

#### List All Topics
```
GET /api/topics
```

**Response (200):**
```json
{
  "topics": [
    {
      "id": 1,
      "name": "JavaScript",
      "description": "All things JavaScript",
      "createdAt": "2026-01-27T08:00:00.000Z",
      "_count": {
        "posts": 42
      }
    }
  ],
  "count": 1
}
```

#### Get Topic by ID
```
GET /api/topics/:id
```

**Response (200):**
```json
{
  "topic": {
    "id": 1,
    "name": "JavaScript",
    "description": "All things JavaScript",
    "createdAt": "2026-01-27T08:00:00.000Z",
    "_count": {
      "posts": 42
    }
  }
}
```

**Response (404):**
```json
{
  "error": "Topic not found"
}
```

#### Get Topic by Name
```
GET /api/topics/by-name/:name
```

Case-insensitive search for topics by name.

**Example:** `GET /api/topics/by-name/javascript`

**Response (200):**
```json
{
  "topic": {
    "id": 1,
    "name": "JavaScript",
    "description": "All things JavaScript",
    "createdAt": "2026-01-27T08:00:00.000Z",
    "_count": {
      "posts": 42
    }
  }
}
```

## Posts API

Posts are user-generated learning content with strict validation rules.

### Validation Rules

1. **Title:** Max 60 characters (enforced at DB and API level)
2. **Content:** 80-220 words (strictly enforced at API level)
3. **Primary Topic:** Must be a valid topic ID
4. **Author:** Must be authenticated user

### Word Count Function

Words are counted by splitting content on whitespace. Only non-empty strings are counted.

```javascript
// Example word counts:
"Hello world" → 2 words
"Hello   world" → 2 words (multiple spaces count as one separator)
"" → 0 words
```

### Endpoints

#### Create Post
```
POST /api/posts
Authorization: ******
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Understanding JavaScript Closures",
  "content": "A closure is a function that has access to variables in its outer scope, even after the outer function has returned. This is a powerful feature of JavaScript that enables data privacy and function factories. Closures are created every time a function is created. When we define a function inside another function, the inner function has access to the outer functions variables. This happens because JavaScript uses lexical scoping, which means that the scope of a variable is defined by its location in the source code. Closures are commonly used in JavaScript for callbacks, event handlers, and creating private variables. Understanding closures is essential for writing effective JavaScript code.",
  "primaryTopicId": 1
}
```

**Response (201):**
```json
{
  "message": "Post created successfully",
  "post": {
    "id": 1,
    "title": "Understanding JavaScript Closures",
    "content": "...",
    "authorId": "user-uuid",
    "primaryTopicId": 1,
    "createdAt": "2026-01-27T08:00:00.000Z",
    "deletedAt": null,
    "author": {
      "id": "user-uuid",
      "username": "johndoe",
      "learningScore": 0
    },
    "primaryTopic": {
      "id": 1,
      "name": "JavaScript"
    }
  },
  "wordCount": 95
}
```

**Response (400) - Too Few Words:**
```json
{
  "error": "Content must be at least 80 words (currently 45 words)"
}
```

**Response (400) - Too Many Words:**
```json
{
  "error": "Content must be at most 220 words (currently 250 words)"
}
```

**Response (404) - Invalid Topic:**
```json
{
  "error": "Topic not found"
}
```

#### List Posts
```
GET /api/posts?topicId=1&limit=20&offset=0
```

**Query Parameters:**
- `topicId` (optional): Filter by topic ID
- `authorId` (optional): Filter by author UUID
- `limit` (optional): Number of posts (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Understanding JavaScript Closures",
      "content": "...",
      "authorId": "user-uuid",
      "primaryTopicId": 1,
      "createdAt": "2026-01-27T08:00:00.000Z",
      "deletedAt": null,
      "author": {
        "id": "user-uuid",
        "username": "johndoe",
        "learningScore": 0
      },
      "primaryTopic": {
        "id": 1,
        "name": "JavaScript"
      },
      "_count": {
        "comments": 5,
        "votes": 12
      }
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Get Single Post
```
GET /api/posts/:id
```

**Response (200):**
```json
{
  "post": {
    "id": 1,
    "title": "Understanding JavaScript Closures",
    "content": "...",
    "authorId": "user-uuid",
    "primaryTopicId": 1,
    "createdAt": "2026-01-27T08:00:00.000Z",
    "deletedAt": null,
    "author": {
      "id": "user-uuid",
      "username": "johndoe",
      "learningScore": 0,
      "createdAt": "2026-01-20T08:00:00.000Z"
    },
    "primaryTopic": {
      "id": 1,
      "name": "JavaScript",
      "description": "All things JavaScript"
    },
    "_count": {
      "comments": 5,
      "votes": 12
    }
  }
}
```

**Response (404):**
```json
{
  "error": "Post not found"
}
```

#### Get Posts by Topic
```
GET /api/posts/topic/:topicId?limit=20&offset=0
```

**Response (200):**
```json
{
  "topic": {
    "id": 1,
    "name": "JavaScript",
    "description": "All things JavaScript",
    "createdAt": "2026-01-27T08:00:00.000Z"
  },
  "posts": [...],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Get Posts by Author
```
GET /api/posts/author/:authorId?limit=20&offset=0
```

**Response (200):**
```json
{
  "author": {
    "id": "user-uuid",
    "username": "johndoe",
    "learningScore": 0,
    "createdAt": "2026-01-20T08:00:00.000Z"
  },
  "posts": [...],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Update Post
```
PUT /api/posts/:id
Authorization: ******
Content-Type: application/json
```

**Request Body (all optional):**
```json
{
  "title": "Understanding JavaScript Closures - Updated",
  "content": "Updated content with 80-220 words...",
  "primaryTopicId": 2
}
```

**Response (200):**
```json
{
  "message": "Post updated successfully",
  "post": {...}
}
```

**Response (403) - Not Owner:**
```json
{
  "error": "You can only update your own posts"
}
```

**Response (400) - Content Too Short:**
```json
{
  "error": "Content must be at least 80 words (currently 45 words)"
}
```

#### Delete Post (Soft Delete)
```
DELETE /api/posts/:id
Authorization: ******
```

Sets the `deletedAt` timestamp without removing from database. Deleted posts are excluded from all queries.

**Response (200):**
```json
{
  "message": "Post deleted successfully"
}
```

**Response (403) - Not Owner:**
```json
{
  "error": "You can only delete your own posts"
}
```

## Features

### Content Validation

All post content is strictly validated:

1. **Title Validation:**
   - Required and non-empty
   - Max 60 characters
   - Whitespace trimmed

2. **Content Validation:**
   - Required and non-empty
   - Word count between 80-220 words
   - Whitespace trimmed
   - Words counted by splitting on whitespace

3. **Topic Validation:**
   - Topic ID must be provided
   - Topic must exist in database

### Soft Delete

Posts are soft-deleted using the `deletedAt` timestamp:
- Deleted posts remain in database
- `deletedAt` is set to current timestamp
- All queries automatically exclude posts where `deletedAt` is not null
- Preserves data for potential future recovery or analytics

### Authorization

Post updates and deletes require:
1. User must be authenticated (valid JWT token)
2. User must be the post author (ownership check)

Uses the `isOwner()` helper from auth middleware:
```javascript
if (!isOwner(req.user.id, post.authorId)) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### Pagination

All list endpoints support pagination:
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Skip N results (default: 0)
- Response includes `hasMore` boolean

## Testing

Use the provided test script to validate functionality:

```bash
# Start server
npm start

# In another terminal, run tests
node test-posts.js
```

The test script validates:
- ✅ List topics
- ✅ Get topic by ID and name
- ✅ Create post with valid content
- ✅ List posts
- ✅ Get post by ID
- ✅ Get posts by topic
- ✅ Get posts by author
- ✅ Update post
- ✅ Delete post (soft delete)
- ✅ Word count validation (too short, too long)
- ✅ Topic validation

## What's NOT Included

Phase 3 is Topics and Posts only. The following are NOT implemented:
- ❌ Comments on posts (Phase 4)
- ❌ Voting on posts (Phase 4)
- ❌ Saving/bookmarking posts (Phase 4)
- ❌ Feed ranking algorithms
- ❌ Reputation system
- ❌ Moderation features
- ❌ Topic creation (admin-only, later phase)

## Database Schema Notes

No schema changes were made in Phase 3. The existing schema from Phase 1 is used:

- **Posts** table has `deletedAt` field for soft deletes
- **Posts** have foreign key to `primaryTopicId`
- **Posts** have foreign key to `authorId`
- Title is `VARCHAR(60)` at database level
- Content is `TEXT` at database level

## Next Steps

Phase 4 will implement:
- Comments on posts
- Voting system (upvotes only)
- Saved posts functionality
- Additional filtering and sorting options
