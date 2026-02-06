/**
 * Security Headers Middleware
 *
 * Sets various HTTP headers to improve security.
 * Replaces helmet for a lightweight, custom implementation.
 */

const securityHeaders = (req, res, next) => {
  // Prevent browsers from sniffing the MIME type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking by disallowing the site to be embedded in a frame
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS filtering in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // HTTP Strict Transport Security (HSTS)
  // Tells browsers to only access the site via HTTPS for the next year
  // Include subdomains for comprehensive coverage
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Control how much referrer information is sent with requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (CSP)
  // Restricts the sources from which content can be loaded
  // This is a relatively permissive policy to start with, to avoid breaking functionality
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-inline/eval needed for some dev tools/libraries; tighten in future
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.vercel.app", // Allow connections to backend (self) and frontend (Vercel)
    "object-src 'none'",
    "media-src 'none'",
    "frame-ancestors 'none'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);

  next();
};

export default securityHeaders;
