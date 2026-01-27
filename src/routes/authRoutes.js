/**
 * Authentication Routes
 * 
 * Phase 2: Registration and login endpoints only.
 * Phase 7: Added rate limiting for abuse protection.
 */

import express from 'express';
import { register, login } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 * 
 * Rate limit: 5 requests per 15 minutes (IP-based)
 * 
 * Body:
 * - email: string (unique, valid email format)
 * - username: string (unique, 3-30 chars, alphanumeric + underscores)
 * - password: string (min 8 chars, not weak)
 * 
 * Response:
 * - 201: User created successfully (no token)
 * - 400: Validation error
 * - 409: Email or username already exists
 * - 429: Too many requests
 */
router.post('/register', authLimiter, register);

/**
 * POST /api/auth/login
 * Login with email and password
 * 
 * Rate limit: 5 requests per 15 minutes (IP-based)
 * 
 * Body:
 * - email: string
 * - password: string
 * 
 * Response:
 * - 200: Login successful, returns JWT token
 * - 401: Invalid credentials
 * - 429: Too many requests
 */
router.post('/login', authLimiter, login);

export default router;
