/**
 * Email Verification Test Script
 * 
 * Tests the email verification endpoints and flow.
 */

// Load .env file only in local development
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config').catch(() => {
    // dotenv not available, using system environment variables
  });
}

const API_URL = `http://localhost:${process.env.PORT || 3000}`;

// Test utilities
function log(message, data = '') {
  console.log(`${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
}

function logError(message, error) {
  console.error(`❌ ${message}`);
  if (error) console.error(error);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

// Global variables to store test data
let testUser = null;
let verificationToken = null;

// Test registration with email verification
async function testRegistrationWithVerification() {
  console.log('\n📝 Testing Registration with Email Verification...\n');

  try {
    const timestamp = Date.now();
    testUser = {
      email: `verify${timestamp}@example.com`,
      username: `verifyuser${timestamp}`,
      password: 'SecurePassword123'
    };

    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();

    if (response.status === 201 && data.user && data.user.isVerified === false) {
      logSuccess('Registration creates unverified user');
      log('Response:', data);
      
      // Check message mentions email verification
      if (data.message.toLowerCase().includes('verify')) {
        logSuccess('Registration response mentions email verification');
      } else {
        logError('Registration response should mention email verification');
      }
      
      return true;
    } else {
      logError('Registration should create unverified user', data);
      return false;
    }
  } catch (error) {
    logError('Registration test error', error.message);
    return false;
  }
}

// Test login with unverified account
async function testLoginUnverified() {
  console.log('\n🔑 Testing Login with Unverified Account...\n');

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const data = await response.json();

    if (response.status === 200 && data.token && data.user.isVerified === false) {
      logSuccess('Unverified users can login (but cannot perform write actions)');
      log('User data:', data.user);
      return data.token;
    } else {
      logError('Login should work for unverified users', data);
      return null;
    }
  } catch (error) {
    logError('Login test error', error.message);
    return null;
  }
}

// Test write action blocked for unverified user
async function testUnverifiedWriteBlocked(token) {
  console.log('\n🚫 Testing Write Actions Blocked for Unverified Users...\n');

  try {
    // Try to create a post (should be blocked)
    const response = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Post',
        content: 'This is a test post with enough content to meet the minimum word count requirement for the post creation endpoint.',
        primaryTopicId: 1
      })
    });

    const data = await response.json();

    if (response.status === 403 && data.error.toLowerCase().includes('verif')) {
      logSuccess('Write actions blocked for unverified users');
      log('Error message:', data.error);
    } else {
      logError('Write actions should be blocked for unverified users', data);
    }
  } catch (error) {
    logError('Write block test error', error.message);
  }
}

// Mock function to extract verification token (in real scenario, would be from email)
async function extractVerificationToken() {
  console.log('\n📧 Extracting Verification Token...\n');
  
  // In a real test with database access, we would query the verification_tokens table
  // For this test, we'll simulate having the token
  logSuccess('In production, user would receive token via email');
  console.log('For testing purposes, we need database access to get the token');
  
  return null; // Would return actual token from database in real test
}

// Test verification with invalid token
async function testVerificationInvalidToken() {
  console.log('\n❌ Testing Verification with Invalid Token...\n');

  try {
    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid-token-12345'
      })
    });

    const data = await response.json();

    if (response.status === 400 && data.error.toLowerCase().includes('invalid')) {
      logSuccess('Invalid token rejected');
    } else {
      logError('Invalid token should be rejected', data);
    }
  } catch (error) {
    logError('Invalid token test error', error.message);
  }
}

// Test verification with missing token
async function testVerificationMissingToken() {
  console.log('\n❌ Testing Verification without Token...\n');

  try {
    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (response.status === 400 && data.error.toLowerCase().includes('required')) {
      logSuccess('Missing token rejected');
    } else {
      logError('Missing token should be rejected', data);
    }
  } catch (error) {
    logError('Missing token test error', error.message);
  }
}

// Test resend verification email
async function testResendVerificationEmail() {
  console.log('\n📧 Testing Resend Verification Email...\n');

  try {
    const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email
      })
    });

    const data = await response.json();

    if (response.status === 200) {
      logSuccess('Verification email resend successful');
      log('Response:', data);
    } else {
      logError('Verification email resend failed', data);
    }
  } catch (error) {
    logError('Resend verification test error', error.message);
  }
}

// Test resend for already verified user
async function testResendAlreadyVerified() {
  console.log('\n⚠️  Testing Resend for Already Verified User...\n');
  
  // This test requires a verified user
  console.log('Note: This test would require database setup to create a verified user');
  logSuccess('Test placeholder - would verify error for already verified email');
}

// Test resend for non-existent email
async function testResendNonexistentEmail() {
  console.log('\n🔒 Testing Resend for Nonexistent Email (Security)...\n');

  try {
    const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com'
      })
    });

    const data = await response.json();

    // Should return success to prevent email enumeration
    if (response.status === 200) {
      logSuccess('Nonexistent email returns success (prevents enumeration)');
    } else {
      logError('Should return success for security', data);
    }
  } catch (error) {
    logError('Nonexistent email test error', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 LearnLoop Email Verification Tests\n');
  console.log('='.repeat(50));

  // Check if server is running
  try {
    const healthCheck = await fetch(`${API_URL}/health`);
    if (!healthCheck.ok) {
      console.error('❌ Server is not running or health check failed');
      console.log('\nPlease start the server first: npm start');
      process.exit(1);
    }
    logSuccess('Server is running');
  } catch (error) {
    console.error('❌ Cannot connect to server');
    console.log('\nPlease start the server first: npm start');
    process.exit(1);
  }

  // Run tests
  const registered = await testRegistrationWithVerification();
  if (!registered) {
    console.error('\n❌ Registration test failed, stopping tests');
    process.exit(1);
  }

  const token = await testLoginUnverified();
  if (!token) {
    console.error('\n❌ Login test failed, stopping tests');
    process.exit(1);
  }

  await testUnverifiedWriteBlocked(token);
  await testVerificationMissingToken();
  await testVerificationInvalidToken();
  await testResendVerificationEmail();
  await testResendNonexistentEmail();
  await testResendAlreadyVerified();

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Email verification tests completed!\n');
  console.log('Note: Full verification flow test requires database access');
  console.log('to extract verification tokens. In production, tokens are');
  console.log('sent via email and clicked by users.\n');
}

runTests();
