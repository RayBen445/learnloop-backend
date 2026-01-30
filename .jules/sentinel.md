## 2026-01-30 - [Timing Attack in Login]
**Vulnerability:** The login endpoint returned immediately if a user was not found, but performed a costly bcrypt comparison if the user was found. This timing difference allows an attacker to enumerate valid email addresses.
**Learning:** Even if we return the same error message ("Invalid email or password"), the time it takes to respond leaks information. Security is not just about what we say, but how (and when) we say it.
**Prevention:** Always perform the same amount of work regardless of whether the user exists. In this case, we use a dummy hash to perform a bcrypt comparison even when the user is not found.
