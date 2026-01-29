# Authentication Behavior Guide

This document explains the expected authentication behavior for the LearnLoop Backend API, particularly addressing the 401 and 409 errors seen in the browser console.

## Overview

The errors mentioned in the problem statement are **expected behaviors** for specific scenarios:
- **401 errors on `/api/me`**: No longer occur - endpoint now uses optional authentication
- **409 errors on `/api/auth/register`**: Expected when email or username already exists

## Changes Made

### 1. `/api/me` Endpoint - Changed to Optional Authentication

**Previous Behavior:**
- Required authentication (JWT token)
- Returned 401 error when not authenticated
- Frontend would see console errors when checking authentication status on page load

**New Behavior:**
- Optional authentication
- Returns `{ user: null }` when not authenticated (200 status)
- Returns user data when authenticated (200 status)
- No more 401 errors for unauthenticated requests

**Example Responses:**

```javascript
// Not authenticated or invalid token
GET /api/me
Response: 200 OK
{
  "user": null
}

// Authenticated with valid token
GET /api/me
Headers: { Authorization: "Bearer <valid_token>" }
Response: 200 OK
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "bio": "Learning enthusiast",
    "learningScore": 42,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Frontend Usage:**

```javascript
// Check authentication status on page load
async function checkAuth() {
  const response = await fetch('https://api.example.com/api/me', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  const data = await response.json();
  
  if (data.user) {
    // User is authenticated
    console.log('Logged in as:', data.user.username);
  } else {
    // User is not authenticated
    console.log('Not logged in');
  }
  
  // No more 401 errors in console!
}
```

### 2. Enhanced Error Responses

All authentication and settings endpoints now return consistent error responses with:
- `error`: Short technical description
- `message`: User-friendly message for display
- `code`: Error code for programmatic handling

**Example Error Responses:**

```javascript
// Missing authentication token
{
  "error": "No authorization token provided",
  "message": "Please log in to access this resource.",
  "code": "NO_TOKEN"
}

// Expired token
{
  "error": "Token has expired",
  "message": "Your session has expired. Please log in again.",
  "code": "TOKEN_EXPIRED"
}

// Invalid token
{
  "error": "Invalid token",
  "message": "Authentication failed. Please log in again.",
  "code": "INVALID_TOKEN"
}

// User not found
{
  "error": "User not found",
  "message": "Your account could not be found. Please log in again.",
  "code": "USER_NOT_FOUND"
}
```

### 3. Registration Endpoint - 409 Conflicts

**Expected Behavior:**

The `/api/auth/register` endpoint returns 409 (Conflict) errors when:
1. Email is already registered
2. Username is already taken

This is **correct and expected behavior** - not a bug.

**Example Responses:**

```javascript
// Email already exists
POST /api/auth/register
{
  "email": "existing@example.com",
  "username": "newuser",
  "password": "SecurePass123"
}

Response: 409 Conflict
{
  "error": "Email already registered",
  "message": "This email is already in use. Please use a different email or try logging in.",
  "code": "EMAIL_EXISTS"
}

// Username already taken
POST /api/auth/register
{
  "email": "newemail@example.com",
  "username": "existinguser",
  "password": "SecurePass123"
}

Response: 409 Conflict
{
  "error": "Username already taken",
  "message": "This username is already in use. Please choose a different username.",
  "code": "USERNAME_EXISTS"
}
```

**Frontend Handling:**

```javascript
async function register(email, username, password) {
  try {
    const response = await fetch('https://api.example.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Display the user-friendly message
      showError(data.message);
      
      // Handle specific error codes if needed
      if (data.code === 'EMAIL_EXISTS') {
        // Suggest login instead
      } else if (data.code === 'USERNAME_EXISTS') {
        // Suggest different username
      }
      return;
    }
    
    // Success
    showSuccess('Account created! Please check your email to verify.');
    
  } catch (error) {
    showError('Network error. Please try again.');
  }
}
```

## Error Code Reference

### Authentication Errors (401)

| Code | Meaning | User Action |
|------|---------|-------------|
| `NO_TOKEN` | No authentication token provided | Log in |
| `INVALID_AUTH_FORMAT` | Authorization header format is incorrect | Log in again |
| `TOKEN_EXPIRED` | JWT token has expired | Log in again |
| `INVALID_TOKEN` | JWT token is invalid or malformed | Log in again |
| `INVALID_CREDENTIALS` | Email or password is incorrect | Check credentials and try again |
| `USER_NOT_FOUND` | User account doesn't exist | Log in again |
| `AUTH_REQUIRED` | Endpoint requires authentication | Log in |

### Validation Errors (400)

| Code | Meaning | User Action |
|------|---------|-------------|
| `MISSING_FIELDS` | Required fields are missing | Provide all required fields |
| `MISSING_CREDENTIALS` | Email and password are required for login | Provide both email and password |
| `INVALID_EMAIL` | Email format is invalid | Enter valid email |
| `INVALID_USERNAME` | Username doesn't meet requirements | Fix username (3-30 chars, alphanumeric + underscores) |
| `WEAK_PASSWORD` | Password is too weak | Choose stronger password (min 8 chars) |
| `INVALID_BIO` | Bio is too long | Shorten bio (max 160 chars) |
| `NO_FIELDS_TO_UPDATE` | No update fields provided | Provide at least one field to update |

### Conflict Errors (409)

| Code | Meaning | User Action |
|------|---------|-------------|
| `EMAIL_EXISTS` | Email is already registered | Use different email or log in |
| `USERNAME_EXISTS` | Username is already taken | Choose different username |

### Forbidden Errors (403)

| Code | Meaning | User Action |
|------|---------|-------------|
| `EMAIL_NOT_VERIFIED` | Email verification required | Verify email before logging in |
| `EMAIL_VERIFICATION_REQUIRED` | Action requires verified email | Verify email to continue |

### Server Errors (500)

| Code | Meaning | User Action |
|------|---------|-------------|
| `SERVER_ERROR` | Internal server error | Try again later or contact support |

## Summary

The authentication system now provides:

1. **Better UX**: `/api/me` no longer throws 401 errors in console
2. **Consistent errors**: All endpoints return structured error responses
3. **Frontend-friendly**: Messages designed for display to users
4. **Programmatic handling**: Error codes for conditional logic

The 401 and 409 errors mentioned in the original problem statement are **resolved**:
- ✅ 401 on `/api/me` - Fixed by using optional authentication
- ✅ 409 on `/api/auth/register` - Working as expected, enhanced with better error messages
- ✅ All errors now include user-friendly messages and error codes
