# Email Verification Feature Flag

## Overview

The email verification system in LearnLoop backend can be temporarily disabled using the `REQUIRE_EMAIL_VERIFICATION` environment variable. This feature flag allows you to control whether users must verify their email address before logging in.

## Configuration

### Environment Variable

Add to your `.env` file (without quotes):

```bash
REQUIRE_EMAIL_VERIFICATION=true  # Enable email verification (recommended for production)
# or
REQUIRE_EMAIL_VERIFICATION=false # Disable email verification
# or leave unset (defaults to disabled)
```

**Note**: The code checks if the value is exactly the string `'true'` (case-sensitive). Any other value or unset variable will be treated as disabled.

### Behavior Matrix

| REQUIRE_EMAIL_VERIFICATION | Registration Behavior | Login Behavior | Email Sent? |
|---------------------------|----------------------|----------------|-------------|
| `true` (enabled) | User created with `emailVerified: false` | Blocks login until verified | ✅ Yes |
| `false` or unset (disabled) | User created with `emailVerified: true` | Allows immediate login | ❌ No |

## Implementation Details

### Registration Flow

**When verification is ENABLED (`true`):**
1. User registers with email, username, password
2. User is created with `emailVerified: false` and `isVerified: false`
3. Verification token is generated and stored
4. Verification email is sent to user
5. Response: "Verification email sent. Please check your inbox."

**When verification is DISABLED (not `true`):**
1. User registers with email, username, password
2. User is created with `emailVerified: true` and `isVerified: true`
3. No verification token is created
4. No email is sent
5. Response: "Registration successful. You can now log in."

### Login Flow

**When verification is ENABLED (`true`):**
1. User provides email and password
2. Credentials are validated
3. **Email verification check**: If `emailVerified === false`, login is blocked
4. Error: "Email not verified" (HTTP 403)

**When verification is DISABLED (not `true`):**
1. User provides email and password
2. Credentials are validated
3. Email verification check is **skipped**
4. JWT token is issued immediately
5. Success: "Login successful" (HTTP 200)

### Code Changes

The feature flag is implemented in `/src/controllers/authController.js`:

**Registration:**
```javascript
// Feature flag: REQUIRE_EMAIL_VERIFICATION controls whether email verification is required
// When disabled (not "true"), auto-verify users on registration
const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
const emailVerified = !requireEmailVerification;

// Create user with isVerified and emailVerified
const user = await prisma.user.create({
  data: {
    // ...
    isVerified: emailVerified,
    emailVerified: emailVerified
  },
  // ...
});

// Only send verification email if email verification is required
if (requireEmailVerification) {
  // Generate token and send email
  // ...
}
```

**Login:**
```javascript
// Feature flag: REQUIRE_EMAIL_VERIFICATION controls whether email verification is required
// Only check email verification if the feature flag is enabled
const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

if (requireEmailVerification && !user.emailVerified) {
  return res.status(403).json({
    error: 'Email not verified',
    message: 'Please verify your email before logging in. Check your inbox for the verification link.',
    code: 'EMAIL_NOT_VERIFIED'
  });
}
```

## Verification Endpoints

The verification endpoints remain available even when the feature flag is disabled:

- `GET /api/auth/verify-email?token=<token>` - Verify email with token (accessed via email link)
- `POST /api/auth/resend-verification` - Resend verification email

These endpoints can be used if email verification is re-enabled in the future.

## Use Cases

### Development/Testing
Disable verification to simplify testing:
```bash
# .env
REQUIRE_EMAIL_VERIFICATION=false
```

### Production
Enable verification for security:
```bash
# .env
REQUIRE_EMAIL_VERIFICATION=true
```

### Gradual Migration
1. Start with verification disabled for existing users
2. Enable verification for new users only
3. Eventually require verification for all users

## Security Considerations

### When Disabled
- ⚠️ Users can register and log in without confirming email ownership
- ⚠️ Potential for spam accounts or email spoofing
- ⚠️ Recommended only for development or trusted environments

### When Enabled
- ✅ Users must prove email ownership before access
- ✅ Reduces spam and fake accounts
- ✅ Better user identity verification

## Backwards Compatibility

### Database Schema
- No schema changes required
- `emailVerified` and `isVerified` fields remain in database
- Existing users are unaffected

### API Contracts
- No breaking changes to API endpoints
- Response messages differ based on flag state
- Error codes remain consistent

### Frontend Compatibility
- No frontend changes required
- Frontend should handle both response messages:
  - "Verification email sent. Please check your inbox."
  - "Registration successful. You can now log in."

## Testing

### Unit Tests
Run the feature flag logic unit tests:
```bash
node test-feature-flag-logic.js
```

### Integration Tests
If you have a running server and database:
```bash
node test-feature-flag.js
```

## Migration Guide

### Disabling Verification

1. Set environment variable:
   ```bash
   REQUIRE_EMAIL_VERIFICATION=false
   ```

2. Restart the server

3. New users will be auto-verified

4. Existing unverified users can now log in

### Re-enabling Verification

1. Set environment variable:
   ```bash
   REQUIRE_EMAIL_VERIFICATION=true
   ```

2. Restart the server

3. New users must verify email

4. **Important**: Existing users with `emailVerified: false` will be blocked from login until they verify

5. Consider running a migration to send verification emails to unverified users:
   ```javascript
   // Example migration (not included)
   const unverifiedUsers = await prisma.user.findMany({
     where: { emailVerified: false }
   });
   // Send verification emails to each user
   ```

## Troubleshooting

### Users Can't Log In After Enabling Verification
**Problem**: Existing users created when verification was disabled may have `emailVerified: true`, but users created during verification-enabled periods have `emailVerified: false`.

**Solution**: Either:
1. Keep verification disabled, or
2. Manually update unverified users in database, or
3. Send verification emails to unverified users

### Verification Emails Not Sending
**Problem**: When verification is enabled but emails aren't sent.

**Solution**: Check email configuration in `.env`:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`

### Feature Flag Not Working
**Problem**: Behavior doesn't change when setting the environment variable.

**Solution**:
1. Ensure the value is exactly `true` (case-sensitive, without quotes in .env file)
2. Restart the server after changing `.env`
3. Check that `.env` file is being loaded (for local development)
4. Verify environment variable is set correctly:
   ```bash
   echo $REQUIRE_EMAIL_VERIFICATION
   ```

## Future Enhancements

Potential improvements to the feature flag system:

1. **Per-User Verification**: Allow some users to bypass verification
2. **Verification Reminder**: Periodic reminders for unverified users
3. **Admin Dashboard**: Toggle verification from admin panel
4. **Rate Limiting**: Different limits based on verification status
5. **Analytics**: Track verification completion rates

## References

- Implementation: `/src/controllers/authController.js`
- Environment Config: `/.env.example`
- Email Utilities: `/src/utils/emailVerification.js`
- Documentation: `/EMAIL_VERIFICATION.md`
