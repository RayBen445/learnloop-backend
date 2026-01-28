/**
 * Comments Routes
 * 
 * CRUD endpoints for comments with authentication.
 * Phase 4: Comments only (no votes or reputation yet).
 * Phase 7: Added rate limiting for abuse protection.
 */

import express from 'express';
import { requireAuth, requireVerified } from '../middleware/authMiddleware.js';
import { createCommentLimiter, updateLimiter, deleteLimiter } from '../middleware/rateLimiters.js';
import {
  createComment,
  listCommentsForPost,
  getCommentById,
  updateComment,
  deleteComment
} from '../controllers/commentsController.js';

const router = express.Router();

/**
 * POST /api/comments
 * Create a new comment
 * Requires authentication
 * 
 * Rate limit: 20 comments per hour (user-based)
 * 
 * Body:
 * - content: string (min 20 characters)
 * - postId: number
 * 
 * Response:
 * - 201: Comment created
 * - 400: Validation error
 * - 404: Post not found
 * - 429: Too many requests
 */
router.post('/', requireAuth, requireVerified, createCommentLimiter, createComment);

/**
 * GET /api/comments/:id
 * Get single comment by ID
 * 
 * Params:
 * - id: Comment ID (number)
 * 
 * Response:
 * - 200: Comment object
 * - 404: Comment not found
 */
router.get('/:id', getCommentById);

/**
 * PUT /api/comments/:id
 * Update comment
 * Requires authentication (author only)
 * 
 * Rate limit: 30 updates per hour (user-based)
 * 
 * Params:
 * - id: Comment ID (number)
 * 
 * Body:
 * - content: string (min 20 characters)
 * 
 * Response:
 * - 200: Updated comment
 * - 403: Not comment owner
 * - 404: Comment not found
 * - 429: Too many requests
 */
router.put('/:id', requireAuth, requireVerified, updateLimiter, updateComment);

/**
 * DELETE /api/comments/:id
 * Delete comment (hard delete)
 * Requires authentication (author only)
 * 
 * Rate limit: 20 deletes per hour (user-based)
 * 
 * Params:
 * - id: Comment ID (number)
 * 
 * Response:
 * - 200: Comment deleted
 * - 403: Not comment owner
 * - 404: Comment not found
 * - 429: Too many requests
 */
router.delete('/:id', requireAuth, requireVerified, deleteLimiter, deleteComment);

export default router;
