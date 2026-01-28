# Email Verification System

This document describes the email verification system implemented for LearnLoop backend.

## Overview

The email verification system ensures that users verify their email addresses before they can perform write actions (creating posts, comments, votes, etc.). This helps prevent spam and ensures user accountability.

## Features

### 1. User Registration with Email Verification

When a user registers:
1. User account is created with `isVerified: false`
2. A secure verification token is generated (32-byte random hex string)
3. Token is stored in the database with a 24-hour expiration
4. Verification email is sent to the user (currently logged to console in development)
5. User receives a success message indicating they need to verify their email

**Endpoint:** `POST /api/auth/register`

**Request:**
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
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "johndoe",
    "learningScore": 0,
    "isVerified": false,
    "createdAt": "2026-01-28T10:00:00.000Z"
  }
}
```

### 2. Email Verification

Users verify their email by clicking a link in the verification email, which calls the verification endpoint with the token.

**Endpoint:** `POST /api/auth/verify-email`

**Request:**
```json
{
  "token": "abc123...verification-token"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Error Responses:**
- `400` - Invalid token: Token not found in database
- `400` - Expired token: Token has passed expiration time
- `400` - Missing token: No token provided in request

**Behavior:**
- Validates token exists and hasn't expired
- Marks user as verified (`isVerified: true`)
- Deletes the verification token (one-time use)
- Sends a success confirmation email
- If user is already verified, returns success without error

### 3. Resend Verification Email

Users can request a new verification email if the original expired or was lost.

**Endpoint:** `POST /api/auth/resend-verification`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent. Please check your inbox."
}
```

**Error Responses:**
- `400` - Email already verified

**Security Features:**
- Returns success even if email doesn't exist (prevents email enumeration)
- Deletes any existing verification tokens before creating new one
- Generates fresh token with new 24-hour expiration

### 4. Login with Verification Status

Users can login whether verified or not, but verification status is included in the response.

**Endpoint:** `POST /api/auth/login`

**Request:**
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
  "token": "jwt-token-here",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "johndoe",
    "learningScore": 0,
    "isVerified": true
  }
}
```

## Database Schema

### User Model Updates

```prisma
model User {
  // ... existing fields ...
  isVerified     Boolean  @default(false) // Email verification status
  
  // Relations
  verificationTokens VerificationToken[]
}
```

### VerificationToken Model

```prisma
model VerificationToken {
  id        Int      @id @default(autoincrement())
  userId    String   @db.Uuid
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("verification_tokens")
}
```

## Middleware Protection

### requireVerified Middleware

The `requireVerified` middleware enforces email verification for write operations.

**Usage:**
```javascript
import { requireAuth, requireVerified } from './middleware/authMiddleware.js';

router.post('/posts', requireAuth, requireVerified, createPost);
```

**Protected Endpoints:**
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/votes` - Add vote
- `DELETE /api/votes/:id` - Remove vote
- `POST /api/saved-posts` - Save post
- `DELETE /api/saved-posts/:postId` - Unsave post
- `POST /api/reports` - Report content

**Error Response (403):**
```json
{
  "error": "Email verification required. Please verify your email to perform this action."
}
```

## Email Service

### Development Mode

In development, verification emails are logged to the console instead of being sent to an actual email service.

**Console Output Example:**
```
========== EMAIL VERIFICATION ==========
To: user@example.com
Subject: Verify your LearnLoop account
---
Hi johndoe,

Thank you for registering with LearnLoop!

Please verify your email address by clicking the link below:
http://localhost:3000/verify-email?token=abc123...

This link will expire in 24 hours.

If you did not create an account, please ignore this email.

Best regards,
The LearnLoop Team
========================================
```

### Production Mode

For production deployment, replace the console logging with actual email service integration:

**Supported Email Services:**
- SendGrid
- AWS SES
- Mailgun
- Postmark
- Custom SMTP

**Implementation Location:** `src/utils/emailVerification.js`

## Security Features

1. **Secure Token Generation**
   - Uses `crypto.randomBytes(32)` for cryptographically secure random tokens
   - 32-byte tokens provide 256 bits of entropy

2. **Token Expiration**
   - Tokens expire after 24 hours
   - Expired tokens are automatically deleted upon verification attempt

3. **One-Time Use**
   - Tokens are deleted after successful verification
   - Cannot be reused

4. **Email Enumeration Prevention**
   - Resend endpoint returns success for non-existent emails
   - Prevents attackers from discovering registered email addresses

5. **Cascade Deletion**
   - Verification tokens are automatically deleted if user is deleted
   - Database enforces referential integrity

6. **Rate Limiting**
   - All auth endpoints are rate limited (5 requests per 15 minutes)
   - Prevents brute force attacks and abuse

## Migration

The email verification feature requires a database migration:

**Migration File:** `prisma/migrations/20260128104936_add_email_verification/migration.sql`

**To apply:**
```bash
npm run db:migrate        # Production
npm run db:migrate:dev    # Development
```

**Changes:**
1. Adds `isVerified` column to `users` table (default: false)
2. Creates `verification_tokens` table
3. Adds foreign key constraint
4. Creates indexes for performance

## Testing

### Manual Testing

1. **Register a new user:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","username":"testuser","password":"SecurePass123"}'
   ```

2. **Check console for verification token**

3. **Verify email:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/verify-email \
     -H "Content-Type: application/json" \
     -d '{"token":"<token-from-console>"}'
   ```

4. **Login and check isVerified:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"SecurePass123"}'
   ```

### Automated Tests

Run the email verification test suite:
```bash
node test-email-verification.js
```

## Environment Variables

No new environment variables are required. Optional:

```env
# Frontend URL for verification links (default: http://localhost:3000)
FRONTEND_URL=https://app.learnloop.com
```

## API Error Codes

| Code | Description |
|------|-------------|
| 201  | User registered successfully |
| 200  | Email verified successfully |
| 200  | Verification email sent |
| 400  | Invalid or expired verification token |
| 400  | Missing required field (email or token) |
| 400  | Email already verified |
| 403  | Email verification required for this action |
| 429  | Rate limit exceeded |

## Future Enhancements

Potential improvements for future versions:

1. **Email Service Integration**
   - Connect to production email service (SendGrid, AWS SES, etc.)
   - HTML email templates
   - Email delivery tracking

2. **Token Cleanup**
   - Background job to delete expired tokens
   - Prevents database bloat

3. **Verification Reminder**
   - Send reminder email after 24 hours if not verified
   - Auto-delete unverified accounts after 7 days

4. **Email Change Verification**
   - Verify new email when user changes email address
   - Keep old email active until new one is verified

5. **Two-Factor Authentication**
   - Optional 2FA for enhanced security
   - Email-based or TOTP-based

## Troubleshooting

### User not receiving verification email

**In Development:**
- Check console logs - emails are printed there
- Look for "EMAIL VERIFICATION" in server output

**In Production:**
- Check email service logs
- Verify email service credentials
- Check spam/junk folder
- Ensure sender domain is verified

### Token expired

- User should use "Resend Verification" endpoint
- Generates new token with fresh 24-hour expiration

### User cannot perform write actions

- Verify user has verified their email
- Check `isVerified` field in database
- Ensure JWT token is being sent correctly
- Check that `requireVerified` middleware is properly applied

## Summary

The email verification system provides:
- ✅ Secure user registration with email verification
- ✅ Token-based verification with expiration
- ✅ Protection against unverified users performing write actions
- ✅ Resend capability for lost/expired tokens
- ✅ Production-safe security practices
- ✅ Clear error messages
- ✅ Rate limiting protection
- ✅ Database migration included
- ✅ Comprehensive testing support
