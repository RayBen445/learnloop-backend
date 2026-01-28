/**
 * Saved Posts Routes
 * 
 * Phase 6: Saved Posts (Bookmarks for revision)
 * Phase 7: Added rate limiting for abuse protection.
 */

import express from 'express';
import { requireAuth, requireVerified, optionalAuth } from '../middleware/authMiddleware.js';
import { saveLimiter } from '../middleware/rateLimiters.js';
import {
  savePost,
  unsavePost,
  getSavedPosts,
  checkIfSaved
} from '../controllers/savedPostsController.js';

const router = express.Router();

/**
 * POST /api/saved-posts
 * Save a post for later review
 * Requires authentication
 * 
 * Rate limit: 30 save actions per hour (user-based)
 * 
 * Body:
 * - postId: number
 * 
 * Response:
 * - 201: Post saved
 * - 404: Post not found
 * - 409: Post already saved
 * - 429: Too many requests
 */
router.post('/', requireAuth, requireVerified, saveLimiter, savePost);

/**
 * GET /api/saved-posts
 * Get all saved posts for current user
 * Requires authentication
 * 
 * Query params:
 * - limit: Number of posts (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * 
 * Response:
 * - 200: Array of saved posts
 */
router.get('/', requireAuth, getSavedPosts);

/**
 * GET /api/saved-posts/check/:postId
 * Check if a post is saved
 * Optional authentication
 * 
 * Params:
 * - postId: Post ID (number)
 * 
 * Response:
 * - 200: isSaved boolean and savedAt timestamp
 */
router.get('/check/:postId', optionalAuth, checkIfSaved);

/**
 * DELETE /api/saved-posts/:postId
 * Remove saved post
 * Requires authentication
 * 
 * Rate limit: 30 save actions per hour (user-based)
 * 
 * Params:
 * - postId: Post ID (number)
 * 
 * Response:
 * - 200: Post unsaved (idempotent)
 * - 429: Too many requests
 */
router.delete('/:postId', requireAuth, requireVerified, saveLimiter, unsavePost);

export default router;
