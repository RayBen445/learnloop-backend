# Phase 5: Votes and Learning Score API

This document covers the Voting system and Learning Score implementation for LearnLoop backend.

## Overview

Phase 5 implements an upvote-only system for posts and comments with automatic learning score updates. Users can upvote helpful content, and content creators earn learning points for quality contributions.

## Voting Model

The voting system supports:
- **Upvotes only** (no downvotes)
- Vote on posts OR comments (not both simultaneously)
- One vote per user per item (prevents spam)
- Cannot vote on own content (prevents gaming)
- Learning score automatically updates on vote add/remove

## Learning Score

The `learningScore` field on the User model tracks reputation:
- **+1 point** when someone upvotes your post or comment
- **-1 point** when someone removes their upvote
- Updates happen atomically in database transactions
- Score starts at 0 for new users (defined in schema default)

## Endpoints

### Add Upvote

```
POST /api/votes
Authorization: ******
Content-Type: application/json
```

Add an upvote to a post or comment. Increments the author's learning score by 1.

**Request Body (vote on post):**
```json
{
  "postId": 1
}
```

**Request Body (vote on comment):**
```json
{
  "commentId": 5
}
```

**Rules:**
- Must provide exactly one of `postId` or `commentId`
- Cannot vote on your own content
- Cannot vote twice on the same content
- Post must exist and not be soft-deleted
- Comment must exist

**Response (201) - Success:**
```json
{
  "message": "Vote added successfully",
  "vote": {
    "id": 123,
    "userId": "user-uuid",
    "postId": 1,
    "commentId": null,
    "type": "UPVOTE",
    "votedAt": "2026-01-27T08:00:00.000Z"
  }
}
```

**Response (400) - Validation Error:**
```json
{
  "error": "Must provide exactly one of postId or commentId"
}
```

**Response (403) - Self-Voting:**
```json
{
  "error": "Cannot vote on your own post"
}
```

**Response (404) - Not Found:**
```json
{
  "error": "Post not found"
}
```

**Response (409) - Already Voted:**
```json
{
  "error": "You have already voted on this post",
  "voteId": 123
}
```

### Remove Upvote

```
DELETE /api/votes/:id
Authorization: ******
```

Remove your upvote. Decrements the author's learning score by 1.

**Parameters:**
- `id` - Vote ID (returned when vote was created or from GET endpoints)

**Response (200) - Success:**
```json
{
  "message": "Vote removed successfully"
}
```

**Response (403) - Not Owner:**
```json
{
  "error": "You can only remove your own votes"
}
```

**Response (404) - Not Found:**
```json
{
  "error": "Vote not found"
}
```

### Get Post Votes

```
GET /api/votes/posts/:id
Authorization: ****** (optional)
```

Get vote count for a post and check if current user has voted.

**Parameters:**
- `id` - Post ID

**Response (200) - Authenticated User:**
```json
{
  "postId": 1,
  "count": 42,
  "hasVoted": true,
  "userVoteId": 123
}
```

**Response (200) - Anonymous User:**
```json
{
  "postId": 1,
  "count": 42,
  "hasVoted": false,
  "userVoteId": null
}
```

**Response (404) - Post Not Found:**
```json
{
  "error": "Post not found"
}
```

### Get Comment Votes

```
GET /api/votes/comments/:id
Authorization: ****** (optional)
```

Get vote count for a comment and check if current user has voted.

**Parameters:**
- `id` - Comment ID

**Response (200) - Authenticated User:**
```json
{
  "commentId": 5,
  "count": 15,
  "hasVoted": true,
  "userVoteId": 456
}
```

**Response (200) - Anonymous User:**
```json
{
  "commentId": 5,
  "count": 15,
  "hasVoted": false,
  "userVoteId": null
}
```

**Response (404) - Comment Not Found:**
```json
{
  "error": "Comment not found"
}
```

## Features

### Transaction Safety

All vote operations use **database transactions** to ensure consistency:

```javascript
// Vote creation and learning score update happen atomically
await prisma.$transaction(async (tx) => {
  // 1. Create vote
  const vote = await tx.vote.create({ ... });
  
  // 2. Update author's learning score
  await tx.user.update({
    data: { learningScore: { increment: 1 } }
  });
});
```

If either operation fails, both are rolled back automatically.

### Duplicate Prevention

The database schema enforces uniqueness:
- `@@unique([userId, postId])` - prevents duplicate votes on posts
- `@@unique([userId, commentId])` - prevents duplicate votes on comments

PostgreSQL treats NULL values as distinct, so the unique constraints work correctly for votes on posts OR comments.

### Self-Voting Prevention

Users cannot vote on their own content:
```javascript
if (post.authorId === userId) {
  return res.status(403).json({
    error: 'Cannot vote on your own post'
  });
}
```

This prevents gaming the learning score system.

### Soft-Deleted Posts

Votes cannot be added to soft-deleted posts:
```javascript
if (!post || post.deletedAt !== null) {
  return res.status(404).json({
    error: 'Post not found'
  });
}
```

Existing votes on deleted posts remain (for historical accuracy) but new votes are blocked.

### Optional Authentication

The GET endpoints support optional authentication:
- **Authenticated**: Returns whether user has voted + vote ID
- **Anonymous**: Returns vote count only

Uses the `optionalAuth` middleware which attaches `req.user` if token is valid, but doesn't reject unauthenticated requests.

## Learning Score Mechanics

### Incrementing Score

When a user receives an upvote:
```javascript
await tx.user.update({
  where: { id: authorId },
  data: {
    learningScore: {
      increment: 1
    }
  }
});
```

### Decrementing Score

When an upvote is removed:
```javascript
await tx.user.update({
  where: { id: authorId },
  data: {
    learningScore: {
      decrement: 1
    }
  }
});
```

### Default Value

New users start with `learningScore: 0` (defined in database schema).

### No Minimum Enforced (Yet)

Currently, the learning score can theoretically go negative if votes are removed. Future phases may add a minimum of 0 or other constraints.

## API Routes Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/votes` | Yes | Add upvote to post or comment |
| DELETE | `/api/votes/:id` | Yes (voter) | Remove upvote |
| GET | `/api/votes/posts/:id` | Optional | Get vote count for post |
| GET | `/api/votes/comments/:id` | Optional | Get vote count for comment |

## Error Responses

All endpoints return consistent error responses:

**400 - Bad Request:**
```json
{
  "error": "Must provide exactly one of postId or commentId"
}
```

**401 - Unauthorized:**
```json
{
  "error": "No authorization token provided"
}
```

**403 - Forbidden:**
```json
{
  "error": "Cannot vote on your own post"
}
```

**404 - Not Found:**
```json
{
  "error": "Post not found"
}
```

**409 - Conflict:**
```json
{
  "error": "You have already voted on this post",
  "voteId": 123
}
```

**500 - Internal Server Error:**
```json
{
  "error": "Internal server error while adding vote"
}
```

## Examples

### Upvoting a Post

```bash
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -H "Authorization: ******" \
  -d '{
    "postId": 1
  }'
```

### Upvoting a Comment

```bash
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -H "Authorization: ******" \
  -d '{
    "commentId": 5
  }'
```

### Removing an Upvote

```bash
curl -X DELETE http://localhost:3000/api/votes/123 \
  -H "Authorization: ******"
```

### Getting Post Votes (Authenticated)

```bash
curl http://localhost:3000/api/votes/posts/1 \
  -H "Authorization: ******"
```

### Getting Post Votes (Anonymous)

```bash
curl http://localhost:3000/api/votes/posts/1
```

### Getting Comment Votes

```bash
curl http://localhost:3000/api/votes/comments/5
```

## Typical Workflows

### Vote on a Post

1. User views a post
2. GET `/api/votes/posts/:id` to check if they've already voted
3. If not voted, POST `/api/votes` with `postId`
4. Post author's learning score increases by 1
5. UI updates to show vote count + voted state

### Remove Vote

1. User clicks to remove their vote
2. DELETE `/api/votes/:voteId` (from previous GET response)
3. Post author's learning score decreases by 1
4. UI updates to show new vote count + unvoted state

### Display Vote Counts

1. When listing posts/comments, include vote count
2. If user is authenticated, include `hasVoted` status
3. Show vote button state (voted/not voted)
4. Display total vote count

## What's NOT Included

Phase 5 is Votes and Learning Score only. The following are NOT implemented:
- ❌ Downvotes
- ❌ Vote weighting based on voter reputation
- ❌ Feed ranking/sorting by votes
- ❌ Leaderboards
- ❌ Badges or achievements
- ❌ Vote notifications
- ❌ Vote history/analytics
- ❌ Vote decay over time
- ❌ Saved posts functionality

## Database Schema Notes

No schema changes were made in Phase 5. The existing Vote model from Phase 1 is used:

**Vote Model:**
- `id` - Auto-incrementing primary key
- `userId` - Foreign key to User (cascade delete)
- `postId` - Foreign key to Post (cascade delete, nullable)
- `commentId` - Foreign key to Comment (cascade delete, nullable)
- `type` - Enum (currently only UPVOTE)
- `votedAt` - Timestamp of vote creation

**Unique Constraints:**
- `@@unique([userId, postId])` - Prevents duplicate post votes
- `@@unique([userId, commentId])` - Prevents duplicate comment votes

**User Model:**
- `learningScore` - Integer field (default 0)

## Security

- ✅ Authentication required for voting
- ✅ Ownership verified before vote removal
- ✅ Self-voting prevented
- ✅ Transaction safety ensures score consistency
- ✅ Duplicate votes prevented by database constraints
- ✅ Input validation on all endpoints
- ✅ SQL injection prevented by Prisma parameterization

## Performance Considerations

### Database Transactions

Vote operations use transactions which:
- **✅ Pros**: Guarantee consistency
- **⚠️ Cons**: Slightly slower than non-transactional operations

For this use case, consistency is more important than raw speed.

### Vote Count Queries

Vote counts are calculated on-demand using `COUNT()`:
```javascript
const count = await prisma.vote.count({
  where: { postId }
});
```

**Future optimization:** Cache vote counts on Post/Comment models and update via triggers or background jobs.

### Indexes

The schema includes indexes on:
- `userId` - Fast lookup of user's votes
- `postId` - Fast vote count for posts
- `commentId` - Fast vote count for comments

## Next Steps

Phase 6 may implement:
- Saved posts functionality
- User profiles with learning score display
- Feed ranking based on vote counts
- Vote notifications
- Admin moderation tools
