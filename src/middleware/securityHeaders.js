/**
 * Security Headers Middleware
 *
 * Sets standard HTTP security headers to protect against common vulnerabilities.
 * - X-Content-Type-Options: Prevents MIME-sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - X-XSS-Protection: Enables browser XSS filtering
 * - Strict-Transport-Security: Enforces HTTPS (HSTS)
 * - Referrer-Policy: Controls referrer information leakage
 */

export const securityHeaders = (req, res, next) => {
  // Prevent the browser from interpreting files as a different MIME type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent the page from being displayed in a frame (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable the browser's built-in Cross-Site Scripting (XSS) filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Enforce HTTPS (HSTS) - 1 year
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Control what information is included in the Referer header
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};
