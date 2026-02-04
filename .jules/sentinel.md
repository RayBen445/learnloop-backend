## 2026-02-04 - Missing Security Headers Middleware
**Vulnerability:** The application documentation and architectural understanding indicated that security headers were enforced via a custom middleware, but the file `src/middleware/securityHeaders.js` was missing and not referenced in the application entry point.
**Learning:** Documentation and developer assumptions can drift from the actual codebase state. Security controls must be verified by implementation and testing, not just documentation.
**Prevention:** Implement automated tests that verify the presence of critical security headers on every build/deploy to ensure they haven't been accidentally removed or disabled.
