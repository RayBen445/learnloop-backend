/**
 * Posts Routes
 * 
 * CRUD endpoints for posts with authentication.
 * Phase 3: Posts only (no comments, votes, or saves yet).
 * Phase 4: Added comments listing endpoint.
 * Phase 7: Added rate limiting for abuse protection.
 */

import express from 'express';
import { requireAuth, requireVerified } from '../middleware/authMiddleware.js';
import { createPostLimiter, updateLimiter, deleteLimiter } from '../middleware/rateLimiters.js';
import {
  createPost,
  listPosts,
  getPostById,
  getPostsByTopic,
  getPostsByAuthor,
  updatePost,
  deletePost
} from '../controllers/postsController.js';
import { listCommentsForPost } from '../controllers/commentsController.js';

const router = express.Router();

/**
 * POST /api/posts
 * Create a new post
 * Requires authentication
 * 
 * Rate limit: 10 posts per hour (user-based)
 * 
 * Body:
 * - title: string (max 60 chars)
 * - content: string (80-220 words)
 * - primaryTopicId: number
 * 
 * Response:
 * - 201: Post created
 * - 400: Validation error
 * - 404: Topic not found
 * - 429: Too many requests
 */
router.post('/', requireAuth, requireVerified, createPostLimiter, createPost);

/**
 * GET /api/posts
 * List posts with optional filters
 * 
 * Query params:
 * - topicId: Filter by topic (optional)
 * - authorId: Filter by author (optional)
 * - limit: Number of posts (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * 
 * Response:
 * - 200: Array of posts with pagination
 */
router.get('/', listPosts);

/**
 * GET /api/posts/topic/:topicId
 * Get posts by topic
 * 
 * Params:
 * - topicId: Topic ID (number)
 * 
 * Query params:
 * - limit: Number of posts (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * 
 * Response:
 * - 200: Array of posts for the topic
 * - 404: Topic not found
 */
router.get('/topic/:topicId', getPostsByTopic);

/**
 * GET /api/posts/author/:authorId
 * Get posts by author
 * 
 * Params:
 * - authorId: Author UUID
 * 
 * Query params:
 * - limit: Number of posts (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * 
 * Response:
 * - 200: Array of posts by the author
 * - 404: Author not found
 */
router.get('/author/:authorId', getPostsByAuthor);

/**
 * GET /api/posts/:postId/comments
 * List comments for a post
 * 
 * Params:
 * - postId: Post ID (number)
 * 
 * Query params:
 * - limit: Number of comments (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 * 
 * Response:
 * - 200: Array of comments for the post (ordered oldest first)
 * - 404: Post not found
 */
router.get('/:postId/comments', listCommentsForPost);

/**
 * GET /api/posts/:id
 * Get single post by ID
 * 
 * Params:
 * - id: Post ID (number)
 * 
 * Response:
 * - 200: Post object
 * - 404: Post not found
 */
router.get('/:id', getPostById);

/**
 * PUT /api/posts/:id
 * Update post
 * Requires authentication (author only)
 * 
 * Rate limit: 30 updates per hour (user-based)
 * 
 * Params:
 * - id: Post ID (number)
 * 
 * Body (all optional):
 * - title: string (max 60 chars)
 * - content: string (80-220 words)
 * - primaryTopicId: number
 * 
 * Response:
 * - 200: Updated post
 * - 403: Not post owner
 * - 404: Post not found
 * - 429: Too many requests
 */
router.put('/:id', requireAuth, requireVerified, updateLimiter, updatePost);

/**
 * DELETE /api/posts/:id
 * Soft delete post
 * Requires authentication (author only)
 * 
 * Rate limit: 20 deletes per hour (user-based)
 * 
 * Params:
 * - id: Post ID (number)
 * 
 * Response:
 * - 200: Post deleted
 * - 403: Not post owner
 * - 404: Post not found
 * - 429: Too many requests
 */
router.delete('/:id', requireAuth, requireVerified, deleteLimiter, deletePost);

export default router;
