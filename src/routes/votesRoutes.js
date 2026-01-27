/**
 * Votes Routes
 * 
 * Upvote system endpoints with learning score updates.
 * Phase 5: Votes and Learning Score only (no downvotes or ranking).
 */

import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import {
  addVote,
  removeVote,
  getPostVotes,
  getCommentVotes
} from '../controllers/votesController.js';

const router = express.Router();

/**
 * POST /api/votes
 * Add upvote to a post or comment
 * Requires authentication
 * 
 * Body:
 * - postId: number (optional, required if commentId not provided)
 * - commentId: number (optional, required if postId not provided)
 * 
 * Response:
 * - 201: Vote created, author's learning score incremented
 * - 400: Validation error
 * - 403: Cannot vote on own content
 * - 404: Post/comment not found
 * - 409: Already voted
 */
router.post('/', requireAuth, addVote);

/**
 * DELETE /api/votes/:id
 * Remove upvote
 * Requires authentication (voter only)
 * 
 * Params:
 * - id: Vote ID (number)
 * 
 * Response:
 * - 200: Vote removed, author's learning score decremented
 * - 403: Not vote owner
 * - 404: Vote not found
 */
router.delete('/:id', requireAuth, removeVote);

/**
 * GET /api/votes/posts/:id
 * Get vote count for a post
 * Optional authentication
 * 
 * Params:
 * - id: Post ID (number)
 * 
 * Response:
 * - 200: Vote count and hasVoted status
 * - 404: Post not found
 */
router.get('/posts/:id', optionalAuth, getPostVotes);

/**
 * GET /api/votes/comments/:id
 * Get vote count for a comment
 * Optional authentication
 * 
 * Params:
 * - id: Comment ID (number)
 * 
 * Response:
 * - 200: Vote count and hasVoted status
 * - 404: Comment not found
 */
router.get('/comments/:id', optionalAuth, getCommentVotes);

export default router;
