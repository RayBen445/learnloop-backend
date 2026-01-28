# Users API Documentation

Read-only public user profile endpoints for LearnLoop Backend.

## Overview

The Users API provides **read-only** access to public user profile information. These endpoints are designed to:

- Expose only public user data (no sensitive information)
- Require NO authentication
- Support viewing user profiles and their content
- Never expose email, password, or admin status

## Endpoints

### Get Public User Info

Get public information about a user by their ID.

**Endpoint:** `GET /api/users/:id`

**Authentication:** Not required (public endpoint)

**URL Parameters:**
- `id` (string, required) - User UUID

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "learningScore": 42
  }
}
```

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Internal server error while fetching user"
}
```

## User Fields

### Public Fields (Returned by API)
- `id` - User's unique UUID identifier
- `username` - User's display name
- `createdAt` - Account creation timestamp
- `learningScore` - User's learning score (gamification metric)

### Private Fields (Never Returned)
- `email` - User's email address (sensitive)
- `hashedPassword` - User's password hash (sensitive)
- `isAdmin` - Admin status flag (sensitive)

## Security

### Data Protection
- **Strict Prisma Selection**: Uses `select` to explicitly include only public fields
- **No Sensitive Data**: Email, password, and admin status are never included in responses
- **Input Validation**: UUID validation handled by Prisma
- **Error Handling**: Generic error messages prevent information disclosure

### Rate Limiting
- No rate limiting on read-only endpoints
- Public access without authentication

## Related Endpoints

### Get User's Posts
To fetch posts by a specific user, use the posts-by-author endpoint:

**Endpoint:** `GET /api/posts/author/:authorId`

**Response includes:**
- Post id, title, createdAt
- Topic (id and name)
- Vote count
- Comment count
- Author information (id, username, learningScore)

See [POSTS.md](./POSTS.md) for full documentation.

## Usage Examples

### Get User Profile
```bash
curl http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000
```

### Get User Profile and Their Posts
```bash
# 1. Get user info
curl http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000

# 2. Get their posts
curl http://localhost:3000/api/posts/author/550e8400-e29b-41d4-a716-446655440000
```

### JavaScript Example
```javascript
// Fetch user profile
async function getUserProfile(userId) {
  const response = await fetch(`http://localhost:3000/api/users/${userId}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      console.error('User not found');
      return null;
    }
    throw new Error('Failed to fetch user');
  }
  
  const data = await response.json();
  return data.user;
}

// Fetch user with their posts
async function getUserWithPosts(userId) {
  const [user, postsData] = await Promise.all([
    fetch(`http://localhost:3000/api/users/${userId}`).then(r => r.json()),
    fetch(`http://localhost:3000/api/posts/author/${userId}`).then(r => r.json())
  ]);
  
  return {
    ...user.user,
    posts: postsData.posts,
    totalPosts: postsData.pagination.total
  };
}
```

## Best Practices

1. **Privacy First**: Never expose sensitive user data
2. **Public Access**: These endpoints are intentionally public
3. **Combine with Posts**: Use with posts-by-author for full user profile
4. **Handle 404s**: Always handle the case where a user doesn't exist
5. **No Editing**: This is a read-only API - no user profile editing is supported

## Error Handling

### Common Errors
- **404 Not Found**: User ID doesn't exist in database
- **500 Internal Server Error**: Database connection or query error

### Error Response Format
All errors follow the standard format:
```json
{
  "error": "Error message"
}
```

## Implementation Details

### Database Query
Uses Prisma's `select` to explicitly choose only public fields:
```javascript
prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    username: true,
    createdAt: true,
    learningScore: true
    // email, hashedPassword, isAdmin are excluded
  }
});
```

### Performance
- Single database query per request
- Indexed by UUID primary key (fast lookups)
- No joins or complex aggregations
- Minimal data transfer

## Future Considerations

This API is intentionally minimal and does NOT include:
- Profile editing capabilities
- Avatar/profile picture support
- Follower/following relationships
- Private user settings

These features are explicitly out of scope to maintain simplicity and focus on the core learning platform.
