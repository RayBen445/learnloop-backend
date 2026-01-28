# Frontend Error Handling Guide

## Overview

The backend now provides enhanced error responses with user-friendly messages. This guide shows how to display these errors on the page instead of just logging to the console.

## Backend Error Response Structure

All authentication endpoints now return errors in this format:

```json
{
  "error": "Short technical description",
  "message": "User-friendly message to display on the page",
  "code": "ERROR_CODE_FOR_PROGRAMMATIC_HANDLING"
}
```

## How to Display Errors on the Page

### Basic Example (Vanilla JavaScript)

```html
<!-- HTML Structure -->
<form id="loginForm">
  <div id="errorMessage" class="error-message" style="display: none;"></div>
  
  <input type="email" id="email" placeholder="Email" required>
  <input type="password" id="password" placeholder="Password" required>
  <button type="submit">Log In</button>
</form>

<script>
// JavaScript
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Hide previous errors
  errorMessage.style.display = 'none';
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // DISPLAY ERROR ON PAGE (not console)
      errorMessage.textContent = data.message; // Use the user-friendly message
      errorMessage.style.display = 'block';
      errorMessage.style.color = 'red';
      return;
    }
    
    // Success - handle login
    localStorage.setItem('token', data.token);
    window.location.href = '/dashboard';
    
  } catch (err) {
    // Network error
    errorMessage.textContent = 'Network error. Please check your connection and try again.';
    errorMessage.style.display = 'block';
    errorMessage.style.color = 'red';
  }
});
</script>

<style>
.error-message {
  padding: 10px;
  margin-bottom: 15px;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c00;
}
</style>
```

### React Example with Error State

```tsx
import { useState, FormEvent } from 'react';

interface ErrorResponse {
  error: string;
  message: string;
  code: string;
}

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // DISPLAY ERROR ON PAGE using the message field
        setErrorMessage(data.message);
        setLoading(false);
        return;
      }

      // Success
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';

    } catch (err) {
      setErrorMessage('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ERROR MESSAGE DISPLAYED ON PAGE */}
      {errorMessage && (
        <div className="error-message" role="alert">
          {errorMessage}
        </div>
      )}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
};

export default LoginForm;
```

### React with Specific Error Handling

```tsx
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    setErrorMessage('');
    setShowVerificationPrompt(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // Display error message on page
        setErrorMessage(data.message);
        
        // Handle specific error codes for custom UI
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          setShowVerificationPrompt(true);
        }
        
        return;
      }

      // Success
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';

    } catch (err) {
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* General error message */}
      {errorMessage && (
        <div className="error-alert">
          {errorMessage}
        </div>
      )}

      {/* Special prompt for unverified email */}
      {showVerificationPrompt && (
        <div className="info-alert">
          <button onClick={() => handleResendVerification()}>
            Resend Verification Email
          </button>
        </div>
      )}

      {/* Form fields... */}
    </form>
  );
};
```

### Vue.js Example

```vue
<template>
  <form @submit.prevent="handleLogin">
    <!-- ERROR DISPLAYED ON PAGE -->
    <div v-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </div>

    <input 
      v-model="email" 
      type="email" 
      placeholder="Email" 
      required 
    />
    
    <input 
      v-model="password" 
      type="password" 
      placeholder="Password" 
      required 
    />
    
    <button type="submit" :disabled="loading">
      {{ loading ? 'Logging in...' : 'Log In' }}
    </button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: '',
      errorMessage: '',
      loading: false
    }
  },
  methods: {
    async handleLogin() {
      // Clear previous errors
      this.errorMessage = '';
      this.loading = true;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.email,
            password: this.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          // DISPLAY ERROR ON PAGE
          this.errorMessage = data.message;
          this.loading = false;
          return;
        }

        // Success
        localStorage.setItem('token', data.token);
        this.$router.push('/dashboard');

      } catch (err) {
        this.errorMessage = 'Network error. Please check your connection.';
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.error-message {
  padding: 12px;
  margin-bottom: 16px;
  background-color: #fee;
  border-left: 4px solid #c00;
  color: #c00;
  border-radius: 4px;
}
</style>
```

## All Error Codes and Messages

### Register Endpoint (`/api/auth/register`)

| Code | Message to Display |
|------|-------------------|
| MISSING_FIELDS | Please provide all required fields to create your account. |
| INVALID_EMAIL | Please enter a valid email address. |
| INVALID_USERNAME | Please choose a username between 3-30 characters using only letters, numbers, and underscores. |
| WEAK_PASSWORD | Please choose a stronger password with at least 8 characters. |
| EMAIL_EXISTS | This email is already in use. Please use a different email or try logging in. |
| USERNAME_EXISTS | This username is already in use. Please choose a different username. |
| SERVER_ERROR | An unexpected error occurred. Please try again later. |

### Login Endpoint (`/api/auth/login`)

| Code | Message to Display |
|------|-------------------|
| MISSING_CREDENTIALS | Please provide both email and password to log in. |
| INVALID_CREDENTIALS | The email or password you entered is incorrect. Please try again. |
| EMAIL_NOT_VERIFIED | Please verify your email before logging in. Check your inbox for the verification link. |
| SERVER_ERROR | An unexpected error occurred. Please try again later. |

### Email Verification (`/api/auth/verify-email`)

| Code | Message to Display |
|------|-------------------|
| MISSING_TOKEN | Please provide a verification token from your email. |
| INVALID_TOKEN | This verification link is invalid. Please request a new verification email. |
| TOKEN_EXPIRED | This verification link has expired. Please request a new verification email. |
| SERVER_ERROR | An unexpected error occurred. Please try again later. |

### Resend Verification (`/api/auth/resend-verification`)

| Code | Message to Display |
|------|-------------------|
| MISSING_EMAIL | Please provide your email address to resend the verification email. |
| ALREADY_VERIFIED | Your email has already been verified. You can log in now. |
| SERVER_ERROR | An unexpected error occurred. Please try again later. |

## Best Practices

### 1. Always Display the `message` Field
```javascript
// ✅ GOOD - Show user-friendly message on page
setErrorMessage(data.message);

// ❌ BAD - Just log to console
console.error(data.error);
```

### 2. Clear Previous Errors
```javascript
// Clear error when user starts typing or submits
setErrorMessage('');
```

### 3. Use Error Codes for Special Handling
```javascript
if (data.code === 'EMAIL_NOT_VERIFIED') {
  // Show resend verification button
  setShowResendButton(true);
}
```

### 4. Provide Visual Feedback
```css
.error-message {
  padding: 12px;
  margin-bottom: 16px;
  background-color: #fee;
  border-left: 4px solid #c00;
  color: #c00;
  border-radius: 4px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 5. Handle Network Errors
```javascript
catch (err) {
  // Network error (not from backend)
  setErrorMessage('Network error. Please check your connection and try again.');
}
```

## Testing Your Implementation

1. **Test with wrong credentials**: Should show "The email or password you entered is incorrect."
2. **Test with unverified email**: Should show "Please verify your email before logging in."
3. **Test with existing email on register**: Should show "This email is already in use."
4. **Test with weak password**: Should show specific password requirements
5. **Test with network disconnected**: Should show network error message

## Common Mistakes to Avoid

### ❌ Don't Do This
```javascript
// Only logging to console - user can't see it!
console.error(data.message);
```

### ❌ Don't Do This
```javascript
// Using generic alerts - bad UX
alert(data.message);
```

### ✅ Do This Instead
```javascript
// Display inline on the page with proper styling
setErrorMessage(data.message);
```

## Summary

1. **Backend provides** the `message` field with user-friendly error text
2. **Frontend displays** this message on the page (not console)
3. **Use error codes** for special handling (e.g., show verification prompt)
4. **Clear errors** when user retries
5. **Style appropriately** for good UX

The backend is now ready - the frontend just needs to use `data.message` to display errors on the page!
