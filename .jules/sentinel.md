# Sentinel Journal

## 2024-05-22 - Rate Limiting Key Generation Logic
**Vulnerability:** Rate limiting was IP-based even for authenticated users, allowing bypass via IP rotation and punishing shared IP users.
**Learning:** `express-rate-limit` requires explicit handling of IPv6 normalization when using custom key generators. Simply returning `req.ip` triggers validation errors.
**Prevention:** Always use `ipKeyGenerator(req.ip)` from the library when falling back to IP-based limiting in custom generators.
