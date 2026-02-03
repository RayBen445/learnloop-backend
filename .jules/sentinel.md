## 2024-05-22 - Custom Security Middleware
**Vulnerability:** Missing security headers (High Priority).
**Learning:** This project prefers custom middleware implementations over external libraries like `helmet` to minimize dependencies.
**Prevention:** When adding security features, consider implementing lightweight custom middleware instead of adding large dependencies if the implementation is straightforward.
