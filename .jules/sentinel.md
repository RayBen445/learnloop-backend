## 2024-05-22 - Missing Security Middleware
**Vulnerability:** The application was missing standard security headers (HSTS, X-Frame-Options, etc.) despite documentation/memory suggesting they were enforced.
**Learning:** Documentation or memory can drift from the actual codebase state. Always verify existence of security controls.
**Prevention:** Implement automated tests that specifically check for the presence of required security headers on all endpoints.
