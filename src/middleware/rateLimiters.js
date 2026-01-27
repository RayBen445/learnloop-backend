/**
 * Rate Limiting Middleware
 * 
 * Protects API endpoints from abuse by limiting request frequency.
 * Uses express-rate-limit for IP-based and user-based rate limiting.
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints (register, login)
 * - IP-based limiting (stricter to prevent brute force attacks)
 * - 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

/**
 * Rate limiter for post creation
 * - User-based limiting when authenticated, IP-based otherwise
 * - 10 posts per hour
 */
export const createPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 posts per window
  message: {
    error: 'Too many posts created',
    message: 'You can create up to 10 posts per hour',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip failed requests (applied before requireAuth, so user not always available)
  skipFailedRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many posts created',
      message: 'You have reached the post creation limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

/**
 * Rate limiter for comment creation
 * - User-based limiting when authenticated, IP-based otherwise
 * - 20 comments per hour
 */
export const createCommentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 comments per window
  message: {
    error: 'Too many comments created',
    message: 'You can create up to 20 comments per hour',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many comments created',
      message: 'You have reached the comment creation limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

/**
 * Rate limiter for voting (upvotes/removals)
 * - User-based limiting when authenticated, IP-based otherwise
 * - 60 votes per hour
 */
export const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // 60 votes per window
  message: {
    error: 'Too many voting actions',
    message: 'You can perform up to 60 voting actions per hour',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many voting actions',
      message: 'You have reached the voting action limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

/**
 * Rate limiter for save/unsave operations
 * - User-based limiting when authenticated, IP-based otherwise
 * - 30 save actions per hour
 */
export const saveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 save actions per window
  message: {
    error: 'Too many save actions',
    message: 'You can perform up to 30 save/unsave actions per hour',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many save actions',
      message: 'You have reached the save action limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

/**
 * Rate limiter for content update operations (posts/comments)
 * - User-based limiting when authenticated, IP-based otherwise
 * - 30 updates per hour
 */
export const updateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 updates per window
  message: {
    error: 'Too many update actions',
    message: 'You can perform up to 30 content updates per hour',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many update actions',
      message: 'You have reached the content update limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

/**
 * Rate limiter for delete operations
 * - User-based limiting when authenticated, IP-based otherwise
 * - 20 deletes per hour
 */
export const deleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 deletes per window
  message: {
    error: 'Too many delete actions',
    message: 'You can perform up to 20 delete actions per hour',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many delete actions',
      message: 'You have reached the delete action limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});
