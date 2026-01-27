/**
 * Authentication Routes
 * 
 * Phase 2: Registration and login endpoints only.
 */

import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
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
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login with email and password
 * 
 * Body:
 * - email: string
 * - password: string
 * 
 * Response:
 * - 200: Login successful, returns JWT token
 * - 401: Invalid credentials
 */
router.post('/login', login);

export default router;
