/**
 * Security Headers Middleware
 *
 * Sets various HTTP headers to enhance application security.
 * Replaces the need for 'helmet' dependency to keep dependencies minimal.
 */

export const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS filtering in browser
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Basic Content Security Policy (CSP)
  // Since this is an API, we can be strict, but we allow 'self' just in case.
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  // HSTS (HTTP Strict Transport Security) - Only in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  // Hide X-Powered-By header
  res.removeHeader('X-Powered-By');

  next();
};

export default securityHeaders;
