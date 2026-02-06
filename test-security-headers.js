
import http from 'http';

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}/health`;

const REQUIRED_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'x-xss-protection': '1; mode=block',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.vercel.app; object-src 'none'; media-src 'none'; frame-ancestors 'none';"
};

function checkHeaders() {
  console.log(`Testing security headers at ${URL}...`);

  const req = http.get(URL, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    if (res.statusCode !== 200) {
      console.error('❌ Endpoint returned non-200 status');
      process.exit(1);
    }

    let missingOrInvalid = false;
    const headers = res.headers;

    for (const [header, expectedValue] of Object.entries(REQUIRED_HEADERS)) {
      const actualValue = headers[header];
      if (!actualValue) {
        console.error(`❌ Missing header: ${header}`);
        missingOrInvalid = true;
      } else if (!actualValue.includes(expectedValue.split(';')[0])) {
        // Simple check: strict match or prefix match (for things like CSP that might change)
        // For CSP and STS we might want to be more flexible in this test script
        // but for now let's see what we get.
        // Actually, let's just check presence for CSP and STS if values differ slightly
        // For simple headers, check exact match.

        if (header === 'content-security-policy') {
             if (!actualValue.includes("default-src 'self'")) {
                 console.error(`❌ Invalid header value for ${header}: expected to contain "default-src 'self'", got "${actualValue}"`);
                 missingOrInvalid = true;
             }
        } else {
             if (actualValue !== expectedValue) {
                console.error(`❌ Invalid header value for ${header}: expected "${expectedValue}", got "${actualValue}"`);
                missingOrInvalid = true;
             }
        }
      } else {
        console.log(`✅ ${header}: ${actualValue}`);
      }
    }

    if (missingOrInvalid) {
      console.error('\n❌ Security headers check FAILED');
      process.exit(1);
    } else {
      console.log('\n✅ All security headers present and correct');
      process.exit(0);
    }
  });

  req.on('error', (err) => {
    console.error(`❌ Request error: ${err.message}`);
    // If connection refused, maybe server isn't up yet.
    // But the plan says we wait 5 seconds before running this.
    process.exit(1);
  });
}

checkHeaders();
