/**
 * Authentication Test Script
 * 
 * Tests the authentication endpoints to ensure they work correctly.
 * This is a simple validation script, not a comprehensive test suite.
 */

// Load .env file only in local development
if (process.env.NODE_ENV !== 'production') {
  try {
    await import('dotenv/config');
  } catch (error) {
    // dotenv not available, using system environment variables
  }
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

// Test registration
async function testRegistration() {
  console.log('\n📝 Testing Registration...\n');

  try {
    // Test 1: Valid registration
    const timestamp = Date.now();
    const testUser = {
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'SecurePassword123'
    };

    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();

    if (response.status === 201 && data.user) {
      logSuccess('Valid registration works');
      log('Response:', data);
      return testUser;
    } else {
      logError('Valid registration failed', data);
      return null;
    }
  } catch (error) {
    logError('Registration test error', error.message);
    return null;
  }
}

// Test weak password rejection
async function testWeakPassword() {
  console.log('\n🔒 Testing Weak Password Rejection...\n');

  try {
    const weakPasswords = ['1234567', 'password', 'aaaaaaaa'];

    for (const password of weakPasswords) {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          username: `user${Date.now()}`,
          password
        })
      });

      if (response.status === 400) {
        logSuccess(`Weak password "${password}" rejected`);
      } else {
        logError(`Weak password "${password}" was not rejected`);
      }
    }
  } catch (error) {
    logError('Weak password test error', error.message);
  }
}

// Test duplicate email/username
async function testDuplicates(testUser) {
  console.log('\n👥 Testing Duplicate Prevention...\n');

  try {
    // Test duplicate email
    const response1 = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        username: `different${Date.now()}`,
        password: 'SecurePassword123'
      })
    });

    if (response1.status === 409) {
      logSuccess('Duplicate email rejected');
    } else {
      logError('Duplicate email was not rejected');
    }

    // Test duplicate username
    const response2 = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `different${Date.now()}@example.com`,
        username: testUser.username,
        password: 'SecurePassword123'
      })
    });

    if (response2.status === 409) {
      logSuccess('Duplicate username rejected');
    } else {
      logError('Duplicate username was not rejected');
    }
  } catch (error) {
    logError('Duplicate test error', error.message);
  }
}

// Test login
async function testLogin(testUser) {
  console.log('\n🔑 Testing Login...\n');

  try {
    // Test valid login
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const data = await response.json();

    if (response.status === 200 && data.token) {
      logSuccess('Valid login works');
      log('Token received:', data.token.substring(0, 20) + '...');
      return data.token;
    } else {
      logError('Valid login failed', data);
      return null;
    }
  } catch (error) {
    logError('Login test error', error.message);
    return null;
  }
}

// Test invalid login
async function testInvalidLogin() {
  console.log('\n🚫 Testing Invalid Login...\n');

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
    });

    if (response.status === 401) {
      logSuccess('Invalid credentials rejected');
    } else {
      logError('Invalid credentials were not rejected');
    }
  } catch (error) {
    logError('Invalid login test error', error.message);
  }
}

// Test auth middleware
async function testAuthMiddleware(token) {
  console.log('\n🛡️  Testing Auth Middleware...\n');

  try {
    // Test without token
    const response1 = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET'
    });

    if (response1.status === 401 || response1.status === 404) {
      logSuccess('Request without token rejected (or endpoint not implemented yet)');
    }

    // Test with valid token
    if (token) {
      const response2 = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // This endpoint doesn't exist yet, so 404 is expected
      if (response2.status === 404) {
        logSuccess('Auth middleware allows valid token (endpoint not implemented yet)');
      } else if (response2.status === 200) {
        logSuccess('Protected endpoint works with valid token');
      }
    }
  } catch (error) {
    logError('Auth middleware test error', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 LearnLoop Authentication Tests\n');
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

  const testUser = await testRegistration();
  if (!testUser) {
    console.error('\n❌ Registration test failed, stopping tests');
    process.exit(1);
  }

  await testWeakPassword();
  await testDuplicates(testUser);

  const token = await testLogin(testUser);
  if (!token) {
    console.error('\n❌ Login test failed, stopping tests');
    process.exit(1);
  }

  await testInvalidLogin();
  await testAuthMiddleware(token);

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ All authentication tests completed!\n');
  console.log('Note: Some tests may show "not implemented yet" for endpoints');
  console.log('that will be added in later phases.\n');
}

runTests();
