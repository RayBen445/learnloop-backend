# Sentinel Journal

## 2026-01-27 - Custom Security Headers Middleware Pattern
**Vulnerability:** Missing standard HTTP security headers (HSTS, CSP, X-Frame-Options, etc.) in the default Express setup.
**Learning:** The project constraints (minimize dependencies) required a custom implementation instead of the standard `helmet` library. This revealed that a lightweight, dependency-free security middleware is a viable and effective pattern for this codebase.
**Prevention:** Use the `src/middleware/securityHeaders.js` pattern for future projects or microservices within this architecture to maintain security without bloating dependencies.
