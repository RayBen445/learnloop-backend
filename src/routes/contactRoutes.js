/**
 * Contact Form Routes
 * 
 * Public endpoint for contact form submissions.
 */

import express from 'express';
import { submitContactForm } from '../controllers/contactController.js';
import { contactLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

/**
 * POST /api/contact
 * Submit contact form
 * 
 * Rate limit: 5 requests per hour (IP-based)
 * 
 * Body:
 * - name: string (required)
 * - email: string (required, valid email format)
 * - subject: string (required)
 * - message: string (required)
 * 
 * Response:
 * - 200: Message sent successfully
 * - 400: Validation error
 * - 429: Too many requests
 * - 500: Server error
 */
router.post('/', contactLimiter, submitContactForm);

export default router;
