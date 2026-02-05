/**
 * Security Headers Verification Script
 *
 * Verifies that the application returns the expected security headers.
 */

const API_URL = `http://localhost:${process.env.PORT || 3000}`;

async function verifySecurityHeaders() {
  console.log('🛡️  Testing Security Headers...\n');

  try {
    const response = await fetch(`${API_URL}/health`);

    if (!response.ok) {
      console.error(`❌ Server returned ${response.status} ${response.statusText}`);
      process.exit(1);
    }

    const headers = response.headers;
    let allPassed = true;

    // List of expected headers and their expected values (or partial values)
    const expectedHeaders = [
      { name: 'x-content-type-options', value: 'nosniff' },
      { name: 'x-frame-options', value: 'DENY' },
      { name: 'x-xss-protection', value: '1; mode=block' },
      { name: 'referrer-policy', value: 'strict-origin-when-cross-origin' },
      { name: 'content-security-policy', value: "default-src 'self'" }
    ];

    // Check for presence of headers
    for (const { name, value } of expectedHeaders) {
      const actualValue = headers.get(name);

      if (!actualValue) {
        console.error(`❌ Missing header: ${name}`);
        allPassed = false;
      } else if (!actualValue.includes(value)) {
        console.error(`❌ Incorrect value for ${name}`);
        console.error(`   Expected: ${value}`);
        console.error(`   Actual:   ${actualValue}`);
        allPassed = false;
      } else {
        console.log(`✅ ${name}: ${actualValue}`);
      }
    }

    // Check if X-Powered-By is removed
    const xPoweredBy = headers.get('x-powered-by');
    if (xPoweredBy) {
      console.error(`❌ X-Powered-By header is present: ${xPoweredBy}`);
      allPassed = false;
    } else {
      console.log('✅ X-Powered-By header is removed');
    }

    if (allPassed) {
      console.log('\n✨ All security headers verified successfully!');
    } else {
      console.error('\n❌ Security headers verification failed.');
      process.exit(1);
    }

  } catch (error) {
    console.error('Error connecting to server:', error.message);
    process.exit(1);
  }
}

verifySecurityHeaders();
