/**
 * Security Headers Middleware
 *
 * Adds standard security headers to all responses to protect against
 * common attacks like XSS, clickjacking, and MIME sniffing.
 *
 * Headers added:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - X-XSS-Protection: 1; mode=block
 * - Strict-Transport-Security: max-age=31536000; includeSubDomains (production only)
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Content-Security-Policy: default-src 'self' (basic starting point)
 */

export default function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking by denying iframe embedding
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS filtering in browsers that support it
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control information sent in the Referer header
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Basic Content Security Policy
  // Note: This might need adjustment based on frontend requirements (e.g., images, scripts)
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");

  // HTTP Strict Transport Security (HSTS) - Only in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Remove X-Powered-By header to hide server details
  res.removeHeader('X-Powered-By');

  next();
}
