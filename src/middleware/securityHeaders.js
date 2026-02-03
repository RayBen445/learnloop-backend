/**
 * Security Headers Middleware
 *
 * Sets HTTP response headers to improve security.
 * Replaces the need for 'helmet' to keep dependencies low.
 */

export const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS filtering in browsers that support it
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // HTTP Strict Transport Security (HSTS) - 1 year
  // Only effective on HTTPS, but good to set
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};

export default securityHeaders;
