/**
 * Posts Routes
 * 
 * CRUD endpoints for posts with authentication.
 * Phase 3: Posts only (no comments, votes, or saves yet).
 */

import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  createPost,
  listPosts,
  getPostById,
  getPostsByTopic,
  getPostsByAuthor,
  updatePost,
  deletePost
} from '../controllers/postsController.js';

const router = express.Router();

/**
 * POST /api/posts
 * Create a new post
 * Requires authentication
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
 */
router.post('/', requireAuth, createPost);

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
 */
router.put('/:id', requireAuth, updatePost);

/**
 * DELETE /api/posts/:id
 * Soft delete post
 * Requires authentication (author only)
 * 
 * Params:
 * - id: Post ID (number)
 * 
 * Response:
 * - 200: Post deleted
 * - 403: Not post owner
 * - 404: Post not found
 */
router.delete('/:id', requireAuth, deletePost);

export default router;
