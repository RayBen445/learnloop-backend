# Sentinel's Journal

## 2026-02-02 - Missing Security Headers
**Vulnerability:** Application lacked standard security headers (HSTS, X-Frame-Options, X-Content-Type-Options), increasing risk of XSS and clickjacking.
**Learning:** `helmet` was not installed. Added manual middleware to avoid adding new dependencies without permission.
**Prevention:** Ensure security headers are part of the default middleware stack in `server.js` early in the pipeline.
