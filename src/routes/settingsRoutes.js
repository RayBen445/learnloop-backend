/**
 * Settings Routes
 * 
 * Minimal account settings endpoints for authenticated users.
 * Allows users to view and update their own profile information.
 */

import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { updateLimiter } from '../middleware/rateLimiters.js';
import { getCurrentUser, updateProfile } from '../controllers/settingsController.js';

const router = express.Router();

/**
 * GET /api/me
 * Get current authenticated user's profile
 * 
 * Optional authentication - Returns user if authenticated, null if not
 * 
 * Rate limit: 30 requests per hour (user-based when authenticated)
 * 
 * Response:
 * - 200: User object with fields (id, username, bio, learningScore, createdAt) or { user: null }
 * - 404: User not found (only when authenticated but user doesn't exist)
 * - 429: Too many requests
 * 
 * Security:
 * - Optional auth (JWT) - Returns null instead of 401 when not authenticated
 * - Returns only safe fields (no email, password, or admin status)
 */
router.get('/', optionalAuth, updateLimiter, getCurrentUser);

/**
 * PUT /api/me
 * Update current user's profile
 * 
 * Requires authentication
 * 
 * Rate limit: 30 updates per hour (user-based)
 * 
 * Body (all optional):
 * - username: string (3-30 chars, alphanumeric + underscores)
 * - bio: string (max 160 chars) or null
 * 
 * Response:
 * - 200: Updated user object
 * - 400: Validation error or no fields to update
 * - 409: Username already taken
 * - 429: Too many requests
 * 
 * Security:
 * - Auth required (JWT)
 * - User can only update their own profile
 * - No email or password updates allowed
 * - Username uniqueness enforced
 */
router.put('/', requireAuth, updateLimiter, updateProfile);

export default router;
