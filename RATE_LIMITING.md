# Rate Limiting and Abuse Protection

**Phase 7: Rate Limiting and Abuse Protection**

This document describes the rate limiting implementation for the LearnLoop Backend API. Rate limiting protects the platform from abuse, spam, and brute force attacks while ensuring legitimate users have uninterrupted access.

## Overview

Rate limiting is implemented using `express-rate-limit` with different limits for different types of operations:
- **Stricter limits** for authentication endpoints (brute force protection)
- **Moderate limits** for content creation (spam prevention)
- **Higher limits** for voting and saves (allow normal usage)
- **No limits** on read-only endpoints (encourage learning)

## Implementation

All rate limiters are defined in `src/middleware/rateLimiters.js` and applied explicitly to routes.

### Rate Limiter Configuration

| Endpoint Type | Limit | Window | Scope | Purpose |
|--------------|-------|--------|-------|---------|
| Authentication | 5 req | 15 min | IP-based | Brute force protection |
| Post Creation | 10 req | 1 hour | IP-based | Spam prevention |
| Comment Creation | 20 req | 1 hour | IP-based | Spam prevention |
| Voting (add/remove) | 60 req | 1 hour | IP-based | Manipulation prevention |
| Save/Unsave | 30 req | 1 hour | IP-based | Abuse prevention |
| Content Updates | 30 req | 1 hour | IP-based | Abuse prevention |
| Content Deletes | 20 req | 1 hour | IP-based | Abuse prevention |

**Note**: Authenticated endpoints use IP-based limiting. User-based limiting could be added in the future by implementing custom key generators with proper IPv6 support.

## Rate Limiters

### 1. Authentication Limiter (`authLimiter`)

**Applied to:**
- `POST /api/auth/register`
- `POST /api/auth/login`

**Limit:** 5 requests per 15 minutes (IP-based)

**Purpose:** Prevents brute force attacks on login and spam registrations.

**Example Response (429):**
```json
{
  "error": "Too many authentication attempts",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": 1706349600
}
```

### 2. Post Creation Limiter (`createPostLimiter`)

**Applied to:**
- `POST /api/posts`

**Limit:** 10 posts per hour (IP-based)

**Purpose:** Prevents spam posting while allowing normal content creation.

**Example Response (429):**
```json
{
  "error": "Too many posts created",
  "message": "You have reached the post creation limit. Please try again later.",
  "retryAfter": 1706349600
}
```

### 3. Comment Creation Limiter (`createCommentLimiter`)

**Applied to:**
- `POST /api/comments`

**Limit:** 20 comments per hour (IP-based)

**Purpose:** Prevents comment spam while allowing active discussions.

**Example Response (429):**
```json
{
  "error": "Too many comments created",
  "message": "You have reached the comment creation limit. Please try again later.",
  "retryAfter": 1706349600
}
```

### 4. Vote Limiter (`voteLimiter`)

**Applied to:**
- `POST /api/votes`
- `DELETE /api/votes/:id`

**Limit:** 60 voting actions per hour (IP-based)

**Purpose:** Prevents vote manipulation while allowing genuine engagement.

**Example Response (429):**
```json
{
  "error": "Too many voting actions",
  "message": "You have reached the voting action limit. Please try again later.",
  "retryAfter": 1706349600
}
```

### 5. Save Limiter (`saveLimiter`)

**Applied to:**
- `POST /api/saved-posts`
- `DELETE /api/saved-posts/:postId`

**Limit:** 30 save/unsave actions per hour (IP-based)

**Purpose:** Prevents abuse of the bookmark system.

**Example Response (429):**
```json
{
  "error": "Too many save actions",
  "message": "You have reached the save action limit. Please try again later.",
  "retryAfter": 1706349600
}
```

### 6. Update Limiter (`updateLimiter`)

**Applied to:**
- `PUT /api/posts/:id`
- `PUT /api/comments/:id`

**Limit:** 30 updates per hour (IP-based)

**Purpose:** Prevents abuse of edit functionality.

**Example Response (429):**
```json
{
  "error": "Too many update actions",
  "message": "You have reached the content update limit. Please try again later.",
  "retryAfter": 1706349600
}
```

### 7. Delete Limiter (`deleteLimiter`)

**Applied to:**
- `DELETE /api/posts/:id`
- `DELETE /api/comments/:id`

**Limit:** 20 delete actions per hour (IP-based)

**Purpose:** Prevents abuse of delete functionality.

**Example Response (429):**
```json
{
  "error": "Too many delete actions",
  "message": "You have reached the delete action limit. Please try again later.",
  "retryAfter": 1706349600
}
```

## HTTP Headers

When a rate limit applies, the following headers are included in responses:

### Success Responses (Within Limit)

```
RateLimit-Limit: 10
RateLimit-Remaining: 7
RateLimit-Reset: 1706349600
```

- **RateLimit-Limit**: Maximum number of requests allowed in the window
- **RateLimit-Remaining**: Number of requests remaining in the current window
- **RateLimit-Reset**: Unix timestamp when the rate limit resets

### Rate Limit Exceeded (429)

```
RateLimit-Limit: 10
RateLimit-Remaining: 0
RateLimit-Reset: 1706349600
Retry-After: 3600
```

- **Retry-After**: Seconds until the rate limit resets (also in response body as `retryAfter` timestamp)

## Endpoints Without Rate Limits

The following endpoints have **no rate limits** to encourage learning and exploration:

### Topics (Read-Only)
- `GET /api/topics`
- `GET /api/topics/:id`
- `GET /api/topics/by-name/:name`

### Posts (Read-Only)
- `GET /api/posts`
- `GET /api/posts/:id`
- `GET /api/posts/:postId/comments`
- `GET /api/posts/topic/:topicId`
- `GET /api/posts/author/:authorId`

### Comments (Read-Only)
- `GET /api/comments/:id`

### Votes (Read-Only)
- `GET /api/votes/posts/:id`
- `GET /api/votes/comments/:id`

### Saved Posts (Read-Only)
- `GET /api/saved-posts`
- `GET /api/saved-posts/check/:postId`

### System
- `GET /health`

## Configuration

Rate limiters are centralized in `src/middleware/rateLimiters.js`. To adjust limits:

1. Open `src/middleware/rateLimiters.js`
2. Modify the `windowMs` (time window) or `max` (request count) values
3. Restart the server

Example:
```javascript
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Change this to increase/decrease limit
  // ... rest of config
});
```

## Technical Details

### IP-Based Limiting

All rate limiters currently use IP-based limiting (default behavior of `express-rate-limit`). This means:
- Limits apply per IP address
- IPv4 and IPv6 addresses are handled correctly
- Shared IPs (e.g., corporate networks) share the same limit

### Skip Failed Requests

Rate limiters use `skipFailedRequests: true` which means:
- Only successful requests (HTTP 2xx, 3xx) count toward the limit
- Failed requests (HTTP 4xx, 5xx) do not count
- This prevents attackers from exhausting limits with invalid requests

### Future Enhancements

Potential improvements for future phases:
1. **User-based limits**: Track limits per authenticated user instead of IP
2. **Redis store**: Use Redis for distributed rate limiting across multiple servers
3. **Custom limits**: Allow premium users to have higher limits
4. **Monitoring**: Track rate limit hits for abuse detection
5. **Allowlist**: Bypass rate limits for trusted IPs (e.g., CI/CD)

## Testing Rate Limits

### Example: Test Authentication Rate Limit

```bash
# Attempt to register 6 times in quick succession
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"username\":\"user$i\",\"password\":\"Password123\"}"
  echo ""
done
```

The 6th request should return a 429 status with a rate limit error.

### Example: Check Rate Limit Headers

```bash
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Password123"}'
```

Look for `RateLimit-*` headers in the response.

## Security Considerations

1. **Brute Force Protection**: The 5 requests/15 minutes limit on authentication makes brute force attacks impractical
2. **Spam Prevention**: Content creation limits prevent automated spam bots
3. **Vote Manipulation**: Voting limits make it difficult to artificially inflate scores
4. **Resource Protection**: Limits prevent API abuse that could cause server overload

## Troubleshooting

### "Too many requests" error for legitimate users

**Solution**: Increase the limit for that endpoint in `rateLimiters.js`

### Rate limit not working

**Verify:**
1. Rate limiter is imported in the route file
2. Rate limiter is applied to the route: `router.post('/', limiter, handler)`
3. Server was restarted after changes

### Different users sharing the same IP

**Current behavior**: They share the same rate limit (IP-based)

**Future solution**: Implement user-based rate limiting with custom key generators

## Summary

Rate limiting is a critical security feature that:
- ✅ Prevents brute force attacks on authentication
- ✅ Protects against spam and abuse
- ✅ Ensures fair resource usage
- ✅ Maintains platform quality
- ✅ Does not restrict legitimate reading/learning

All limits can be adjusted in `src/middleware/rateLimiters.js` as the platform grows and usage patterns become clear.
