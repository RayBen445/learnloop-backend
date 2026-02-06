## 2024-05-22 - Missing Standard Security Headers
**Vulnerability:** The application completely lacked standard HTTP security headers (HSTS, X-Content-Type-Options, etc.), relying solely on Express defaults.
**Learning:** The project avoids `helmet` dependency. A custom middleware `src/middleware/securityHeaders.js` was required to implement these manually.
**Prevention:** Ensure `securityHeaders` middleware is applied globally in `server.js` before any routes.
