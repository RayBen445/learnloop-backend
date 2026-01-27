/**
 * Topics Routes
 * 
 * Read-only endpoints for topics.
 * Phase 3: No topic creation yet (admin-only later).
 */

import express from 'express';
import {
  listTopics,
  getTopicById,
  getTopicByName
} from '../controllers/topicsController.js';

const router = express.Router();

/**
 * GET /api/topics
 * List all topics
 * 
 * Response:
 * - 200: Array of topics with post counts
 */
router.get('/', listTopics);

/**
 * GET /api/topics/by-name/:name
 * Get topic by name (case-insensitive)
 * 
 * Params:
 * - name: Topic name
 * 
 * Response:
 * - 200: Topic object
 * - 404: Topic not found
 */
router.get('/by-name/:name', getTopicByName);

/**
 * GET /api/topics/:id
 * Get topic by ID
 * 
 * Params:
 * - id: Topic ID (number)
 * 
 * Response:
 * - 200: Topic object
 * - 404: Topic not found
 */
router.get('/:id', getTopicById);

export default router;
