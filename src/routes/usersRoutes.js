/**
 * Users Routes
 * 
 * Read-only public user profile endpoints.
 * No authentication required, no editing capabilities.
 */

import express from 'express';
import { getUserById } from '../controllers/usersController.js';

const router = express.Router();

/**
 * GET /api/users/:id
 * Get public user info by ID
 * 
 * Params:
 * - id: User UUID
 * 
 * Response:
 * - 200: User object with public fields (id, username, createdAt, learningScore)
 * - 404: User not found
 * 
 * Security:
 * - Public endpoint (no authentication required)
 * - Returns only public fields (no email, password, or admin status)
 */
router.get('/:id', getUserById);

export default router;
