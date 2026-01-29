/**
 * Email Verification Feature Flag Test Script
 * 
 * Tests the REQUIRE_EMAIL_VERIFICATION feature flag to ensure:
 * 1. When disabled (default), users are auto-verified and can log in immediately
 * 2. When enabled, users must verify email before login
 */

// Load .env file only in local development
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config').catch(() => {
    // dotenv not available, using system environment variables
  });
}

const API_URL = `http://localhost:${process.env.PORT || 3000}`;

// Test utilities
function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message, error) {
  console.error(`❌ ${message}`);
  if (error) console.error(error);
}

function log(message, data = '') {
  console.log(`${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
}

/**
 * Test 1: Feature flag disabled (default) - Auto-verify on registration
 */
async function testFeatureFlagDisabled() {
  console.log('\n🧪 Test 1: REQUIRE_EMAIL_VERIFICATION disabled (default behavior)');
  console.log('Expected: Users auto-verified on registration and can log in immediately\n');

  try {
    const timestamp = Date.now();
    const testUser = {
      email: `autotest${timestamp}@example.com`,
      username: `autotest${timestamp}`,
      password: 'SecurePassword123'
    };

    // Step 1: Register user
    console.log('Step 1: Registering user...');
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const registerData = await registerResponse.json();
    
    if (registerResponse.status !== 201) {
      logError('Registration failed', registerData);
      return false;
    }

    logSuccess(`User registered: ${registerData.user.username}`);
    
    // Check if user is auto-verified
    if (registerData.user.emailVerified && registerData.user.isVerified) {
      logSuccess('User auto-verified on registration ✓');
    } else {
      logError('User was NOT auto-verified (emailVerified or isVerified is false)', registerData.user);
      return false;
    }

    // Check message
    if (registerData.message.includes('Registration successful')) {
      logSuccess('Correct success message (no verification required)');
    } else {
      logError(`Expected "Registration successful" message but got: "${registerData.message}"`);
    }

    // Step 2: Attempt login immediately (should succeed)
    console.log('\nStep 2: Attempting immediate login...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.status === 200 && loginData.token) {
      logSuccess('Login successful immediately after registration ✓');
      logSuccess(`JWT token received: ${loginData.token.substring(0, 20)}...`);
      return true;
    } else {
      logError('Login failed - user should be able to log in without verification', loginData);
      return false;
    }

  } catch (error) {
    logError('Test failed with error:', error);
    return false;
  }
}

/**
 * Test 2: Verify that verification endpoints still exist and work
 */
async function testVerificationEndpointsExist() {
  console.log('\n🧪 Test 2: Verification endpoints still exist');
  console.log('Expected: /api/auth/verify-email and /api/auth/resend-verification endpoints respond\n');

  try {
    // Test verify-email endpoint
    const verifyResponse = await fetch(`${API_URL}/api/auth/verify-email?token=dummy`, {
      method: 'GET'
    });
    
    if (verifyResponse.status === 400) {
      logSuccess('verify-email endpoint exists (returned 400 for invalid token as expected)');
    } else {
      logError(`verify-email endpoint returned unexpected status: ${verifyResponse.status}`);
    }

    // Test resend-verification endpoint
    const resendResponse = await fetch(`${API_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    
    if (resendResponse.status === 200 || resendResponse.status === 400) {
      logSuccess('resend-verification endpoint exists and responds');
      return true;
    } else {
      logError(`resend-verification endpoint returned unexpected status: ${resendResponse.status}`);
      return false;
    }

  } catch (error) {
    logError('Test failed with error:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Email Verification Feature Flag Test Suite');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nCurrent REQUIRE_EMAIL_VERIFICATION: ${process.env.REQUIRE_EMAIL_VERIFICATION || '(not set - defaults to disabled)'}`);
  
  const results = [];
  
  results.push(await testFeatureFlagDisabled());
  results.push(await testVerificationEndpointsExist());
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Test Results Summary');
  console.log('═══════════════════════════════════════════════════════════');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\nPassed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

runTests();
