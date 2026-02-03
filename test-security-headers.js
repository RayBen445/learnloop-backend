/**
 * Security Headers Test Script
 *
 * Verifies that the application sends the correct security headers.
 */

// Load .env file only in local development
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config').catch(() => {
    // dotenv not available, using system environment variables
  });
}

const API_URL = `http://localhost:${process.env.PORT || 3000}`;

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

async function testSecurityHeaders() {
  console.log('🛡️  Testing Security Headers...\n');

  try {
    const response = await fetch(`${API_URL}/health`);

    if (!response.ok) {
      logError(`Server returned status ${response.status}`);
      return false;
    }

    const headers = response.headers;
    let allPassed = true;

    const expectedHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '1; mode=block',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'referrer-policy': 'strict-origin-when-cross-origin'
    };

    for (const [header, expectedValue] of Object.entries(expectedHeaders)) {
      const actualValue = headers.get(header);
      if (actualValue === expectedValue) {
        logSuccess(`${header}: ${actualValue}`);
      } else {
        logError(`Missing or incorrect header: ${header}`);
        log(`  Expected: ${expectedValue}`);
        log(`  Actual:   ${actualValue || '(missing)'}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('\n✨ All security headers present and correct!');
      return true;
    } else {
      console.log('\n⚠️ Some security headers are missing or incorrect.');
      return false;
    }

  } catch (error) {
    logError('Connection failed', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 LearnLoop Security Header Tests\n');
  console.log('='.repeat(50));

  // Check if server is running
  try {
    await fetch(`${API_URL}/health`);
  } catch (error) {
    console.error('❌ Cannot connect to server');
    console.log('\nPlease start the server first: npm start');
    process.exit(1);
  }

  const success = await testSecurityHeaders();

  console.log('\n' + '='.repeat(50));

  if (success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
