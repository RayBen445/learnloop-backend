/**
 * Rate Limiting Middleware
 * 
 * Protects API endpoints from abuse by limiting request frequency.
 * Uses express-rate-limit for IP-based and user-based rate limiting.
 * 
 * SYSTEM and BOT role users are exempt from all rate limits.
 */

import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

/**
 * Key generator for rate limiting
 *
 * Uses user ID if authenticated, otherwise falls back to IP address.
 * This prevents users from bypassing limits by rotating IPs,
 * and prevents shared IPs (NAT) from being unfairly limited by one bad actor.
 */
export const userKeyGenerator = (req, res) => {
  if (req.user && req.user.id) {
    return req.user.id;
  }
  return ipKeyGenerator(req.ip);
};

/**
 * Skip function to exempt SYSTEM and BOT users from rate limits
 * 
 * Checks if req.user exists and has role SYSTEM or BOT.
 * Returns true to skip rate limiting for these users.
 */
function skipSystemAndBotUsers(req) {
  // Skip rate limiting for SYSTEM and BOT users
  if (req.user && (req.user.role === 'SYSTEM' || req.user.role === 'BOT')) {
    return true;
  }
  return false;
}

/**
 * Rate limiter for registration endpoint
 * - IP-based limiting (stricter to prevent account creation spam)
 * - 10 requests per 15 minutes
 */
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000);
    res.status(429)
      .set('Retry-After', retryAfter)
      .json({
        error: 'Too many registration attempts',
        message: 'You have exceeded the registration rate limit. Please try again later.',
        retryAfter
      });
  }
});

/**
 * Rate limiter for login endpoint
 * - IP-based limiting (to prevent brute force attacks)
 * - 20 requests per 15 minutes
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000);
    res.status(429)
      .set('Retry-After', retryAfter)
      .json({
        error: 'Too many login attempts',
        message: 'You have exceeded the login rate limit. Please try again later.',
        retryAfter
      });
  }
});

/**
 * Rate limiter for post creation
 * - User-based limiting when authenticated, IP-based otherwise
 * - 30 posts per hour
 * - Exempts SYSTEM and BOT users
 */
export const createPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 posts per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  skip: skipSystemAndBotUsers,
  skipFailedRequests: true,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000);
    res.status(429)
      .set('Retry-After', retryAfter)
      .json({
        error: 'Too many posts created',
        message: 'You have reached the post creation limit. Please try again later.',
        retryAfter
      });
  }
});

/**
 * Rate limiter for comment creation
 * - User-based limiting when authenticated, IP-based otherwise
 * - 60 comments per hour
 * - Exempts SYSTEM and BOT users
 */
export const createCommentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // 60 comments per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  skip: skipSystemAndBotUsers,
  skipFailedRequests: true,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000);
    res.status(429)
      .set('Retry-After', retryAfter)
      .json({
        error: 'Too many comments created',
        message: 'You have reached the comment creation limit. Please try again later.',
        retryAfter
      });
  }
});

/**
 * Rate limiter for voting (upvotes/removals)
 * - User-based limiting when authenticated, IP-based otherwise
 * - 100 votes per hour
 * - Exempts SYSTEM and BOT users
 */
export const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 votes per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  skip: skipSystemAndBotUsers,
  skipFailedRequests: true,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000);
    res.status(429)
      .set('Retry-After', retryAfter)
      .json({
        error: 'Too many voting actions',
        message: 'You have reached the voting action limit. Please try again later.',
        retryAfter
      });
  }
});

/**
 * Rate limiter for save/unsave operations
 * - User-based limiting when authenticated, IP-based otherwise
 * - 30 save actions per hour
 * - Exempts SYSTEM and BOT users
 */
export const saveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 save actions per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  skip: skipSystemAndBotUsers,
  skipFailedRequests: true,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000);
    res.status(429)
      .set('Retry-After', retryAfter)
      .json({
        error: 'Too many save actions',
        message: 'You have reached the save action limit. Please try again later.',
        retryAfter
      });
  }
});

/**
 * Rate limiter for content update operations (posts/comments)
 * - User-based limiting when authenticated, IP-based otherwise
 * - 30 updates per hour
 * - Exempts SYSTEM and BOT users
 */
export const updateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 updates per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  skip: skipSystemAndBotUsers,
  skipFailedRequests: true,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000);
    res.status(429)
      .set('Retry-After', retryAfter)
      .json({
        error: 'Too many update actions',
        message: 'You have reached the content update limit. Please try again later.',
        retryAfter
      });
  }
});

/**
 * Rate limiter for account settings operations (profile updates, password changes)
 * - User-based limiting when authenticated, IP-based otherwise
 * - 30 operations per hour
 * - Exempts SYSTEM and BOT users
 */
export const accountSettingsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 operations per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  skip: skipSystemAndBotUsers,
  skipFailedRequests: true,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000);
    res.status(429)
      .set('Retry-After', retryAfter)
      .json({
        error: 'Too many account settings operations',
        message: 'You have reached the account settings operation limit. Please try again later.',
        retryAfter
      });
  }
});

/**
 * Rate limiter for delete operations
 * - User-based limiting when authenticated, IP-based otherwise
 * - 30 deletes per hour
 * - Exempts SYSTEM and BOT users
 */
export const deleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 deletes per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  skip: skipSystemAndBotUsers,
  skipFailedRequests: true,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000);
    res.status(429)
      .set('Retry-After', retryAfter)
      .json({
        error: 'Too many delete actions',
        message: 'You have reached the delete action limit. Please try again later.',
        retryAfter
      });
  }
});

/**
 * Rate limiter for reporting content (Phase 8)
 * - User-based limiting when authenticated, IP-based otherwise
 * - 10 reports per hour
 * - Exempts SYSTEM and BOT users
 */
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 reports per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  skip: skipSystemAndBotUsers,
  skipFailedRequests: true,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000);
    res.status(429)
      .set('Retry-After', retryAfter)
      .json({
        error: 'Too many reports submitted',
        message: 'You have reached the report submission limit. Please try again later.',
        retryAfter
      });
  }
});

/**
 * Rate limiter for contact form endpoint
 * - IP-based limiting
 * - 5 requests per hour
 */
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000);
    res.status(429)
      .set('Retry-After', retryAfter)
      .json({
        error: 'Too many contact form submissions',
        message: 'You have reached the contact form submission limit. Please try again later.',
        retryAfter
      });
  }
});

// For backward compatibility, export authLimiter as an alias to loginLimiter
export const authLimiter = loginLimiter;

