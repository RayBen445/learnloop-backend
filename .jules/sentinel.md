# Sentinel's Journal

## 2024-05-22 - Express Rate Limit IPv6 Validation
**Vulnerability:** Rate limiting bypass via IPv6 address rotation if `req.ip` is used directly in `keyGenerator`.
**Learning:** `express-rate-limit` v8+ performs strict validation on `keyGenerator`. If it detects `req.ip` usage without `ipKeyGenerator` wrapper, it throws a validation error (logged to console) because raw IPv6 addresses can be infinite (subnets).
**Prevention:** Always use `ipKeyGenerator(req.ip)` when falling back to IP-based rate limiting in custom key generators.
