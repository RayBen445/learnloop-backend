/**
 * Reports Routes - Phase 8
 * Routes for content reporting
 */

import express from 'express';
import { reportContent } from '../controllers/reportsController.js';
import { requireAuth, requireVerified } from '../middleware/authMiddleware.js';
import { reportLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Report content (auth required, rate limited)
router.post('/', requireAuth, requireVerified, reportLimiter, reportContent);

export default router;
