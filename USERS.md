# Users API Documentation

Public user profiles and account settings endpoints for LearnLoop Backend.

## Overview

The Users API provides:
1. **Read-only public user profiles** - View any user's public information
2. **Account settings** - Authenticated users can view and update their own profile

These endpoints are designed to:
- Expose only public user data (no sensitive information)
- Allow users to manage their basic profile information
- Never expose email, password, or admin status

## Public Endpoints

### Get Public User Info

Get public information about any user by their ID.

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
    "bio": "Learning enthusiast and software developer",
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

## Account Settings Endpoints

Authenticated users can view and update their own profile information.

### Get Current User

Get the authenticated user's profile information.

**Endpoint:** `GET /api/me`

**Authentication:** Optional (JWT token)

**Headers (optional):**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK - Authenticated):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "bio": "Learning enthusiast and software developer",
    "learningScore": 42,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (200 OK - Not Authenticated):**
```json
{
  "user": null
}
```

**Response (404 Not Found):**
```json
{
  "error": "User not found",
  "message": "Your account could not be found.",
  "code": "USER_NOT_FOUND"
}
```

### Update Profile

Update the authenticated user's profile information.

**Endpoint:** `PUT /api/me`

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body (all fields optional):**
```json
{
  "username": "newusername",
  "bio": "Updated bio text"
}
```

**Username Validation:**
- 3-30 characters
- Alphanumeric and underscores only
- Must be unique

**Bio Validation:**
- Maximum 160 characters
- Can be null or empty string to clear bio

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "newusername",
    "bio": "Updated bio text",
    "learningScore": 42,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Username must be at least 3 characters"
}
```

or

```json
{
  "error": "No fields to update. Provide username or bio."
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Authentication required"
}
```

**Response (409 Conflict):**
```json
{
  "error": "Username is already taken"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Internal server error while updating profile"
}
```

## User Fields

### Public Fields (Returned by API)
- `id` - User's unique UUID identifier
- `username` - User's display name (editable via settings)
- `bio` - User's biography/description (optional, max 160 chars, editable via settings)
- `createdAt` - Account creation timestamp
- `learningScore` - User's learning score (gamification metric)

### Private Fields (Never Returned)
- `email` - User's email address (sensitive)
- `hashedPassword` - User's password hash (sensitive)
- `isAdmin` - Admin status flag (sensitive)

## Security

### Public Endpoints
- **Strict Prisma Selection**: Uses `select` to explicitly include only public fields
- **No Sensitive Data**: Email, password, and admin status are never included in responses
- **Input Validation**: UUID validation handled by Prisma
- **Error Handling**: Generic error messages prevent information disclosure

### Account Settings Endpoints
- **Authentication Required**: JWT token must be provided
- **User Isolation**: Users can only view and update their own profile
- **Field Restrictions**: Email and password cannot be updated via these endpoints
- **Username Validation**: 3-30 characters, alphanumeric + underscores only
- **Bio Validation**: Maximum 160 characters
- **Uniqueness Check**: Username must be unique across all users
- **Safe Error Messages**: Prevents information disclosure

### Rate Limiting
- No rate limiting on read-only public endpoints
- Account settings endpoints inherit standard authenticated endpoint rate limits

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

### Get Public User Profile
```bash
curl http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000
```

### Get Current User (Authenticated)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/me
```

### Update Username
```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"username":"newusername"}' \
     http://localhost:3000/api/me
```

### Update Bio
```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"bio":"Learning enthusiast and developer"}' \
     http://localhost:3000/api/me
```

### Update Both Username and Bio
```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"username":"newusername","bio":"Updated bio"}' \
     http://localhost:3000/api/me
```

### Clear Bio
```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"bio":null}' \
     http://localhost:3000/api/me
```

### Get User Profile and Their Posts
```bash
# 1. Get user info
curl http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000

# 2. Get their posts
curl http://localhost:3000/api/posts/author/550e8400-e29b-41d4-a716-446655440000
```

### JavaScript Examples

#### Get Public User Profile
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

#### Get Current User (Authenticated)
```javascript
async function getCurrentUser(token) {
  const response = await fetch('http://localhost:3000/api/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      console.error('Not authenticated');
      return null;
    }
    throw new Error('Failed to fetch current user');
  }
  
  const data = await response.json();
  return data.user;
}

#### Update Profile
```javascript
async function updateProfile(token, updates) {
  const response = await fetch('http://localhost:3000/api/me', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const data = await response.json();
  return data.user;
}

// Usage
try {
  const updatedUser = await updateProfile(token, {
    username: 'newusername',
    bio: 'Updated bio text'
  });
  console.log('Profile updated:', updatedUser);
} catch (error) {
  console.error('Update failed:', error.message);
}

#### Fetch User with Their Posts
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
2. **Public vs Private**: Use `/api/users/:id` for public profiles, `/api/me` for own profile
3. **Authentication**: Always include JWT token when accessing `/api/me` endpoints
4. **Validation**: Handle validation errors gracefully on the client side
5. **Username Uniqueness**: Check for 409 Conflict responses when updating username
6. **Bio Length**: Enforce 160 character limit on the client side for better UX
7. **Combine with Posts**: Use with posts-by-author for full user profile pages
8. **Handle 404s**: Always handle the case where a user doesn't exist
9. **No Email/Password Changes**: Use separate dedicated endpoints for email/password updates (not implemented in this API)

## Error Handling

### Common Errors
- **400 Bad Request**: Validation error (invalid username format, bio too long, no fields to update)
- **401 Unauthorized**: Missing or invalid JWT token (settings endpoints only)
- **404 Not Found**: User ID doesn't exist in database
- **409 Conflict**: Username is already taken by another user
- **500 Internal Server Error**: Database connection or query error

### Error Response Format
All errors follow the standard format:
```json
{
  "error": "Error message"
}
```

## Implementation Details

### Public User Endpoint
Database query uses Prisma's `select` to explicitly choose only public fields:
```javascript
prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    username: true,
    bio: true,
    createdAt: true,
    learningScore: true
    // email, hashedPassword, isAdmin are excluded
  }
});
```

### Account Settings Endpoints
- Use `requireAuth` middleware for JWT verification
- User ID extracted from JWT token (`req.user.id`)
- Username uniqueness checked before update
- Strict validation applied to all inputs
- Database queries use explicit field selection

### Validation Rules
**Username:**
- Regex: `/^[a-zA-Z0-9_]+$/`
- Min length: 3 characters
- Max length: 30 characters
- Must be unique (database constraint + app-level check)

**Bio:**
- Max length: 160 characters
- Nullable (can be null or empty)
- Trimmed before saving

### Performance
- Single database query per request (public endpoint)
- Single query for GET, one check + one update for PUT (settings endpoints)
- Indexed by UUID primary key (fast lookups)
- Username uniqueness enforced by database constraint
- No joins or complex aggregations
- Minimal data transfer

## Future Considerations

This API is intentionally minimal and does NOT include:
- Email change functionality (should be separate endpoint with email verification)
- Password change functionality (should be separate endpoint with current password verification)
- Avatar/profile picture support
- Follower/following relationships
- Private user settings
- Admin user management

These features are explicitly out of scope to maintain simplicity and security.
