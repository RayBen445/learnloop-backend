/**
 * Security Headers Middleware
 *
 * Adds essential security headers to all responses to protect against common vulnerabilities.
 * Replaces the need for 'helmet' dependency to keep the project lightweight.
 */

export default function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking by denying framing
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS filtering in browsers that support it
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Enforce HTTPS
  // Include subdomains and preload for maximum security
  // 31536000 seconds = 1 year
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Control which resources can be loaded
  // strict-dynamic allows scripts loaded by trusted scripts (if nonce is used, but we'll use a basic policy for now)
  // This is a strict starting point; might need adjustment if external scripts are used (e.g. analytics)
  // For now, only allow self.
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self';");

  // Control referrer information sent to other sites
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy) - disable powerful features
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');

  next();
}
