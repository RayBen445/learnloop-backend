/**
 * Admin Routes - Phase 8
 * Routes for admin moderation actions
 */

import express from 'express';
import { 
  listReports, 
  getReportDetails, 
  unhideContent,
  dismissReports
} from '../controllers/adminController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All admin routes require both auth and admin privilege
router.use(requireAuth, requireAdmin);

// List all reports
router.get('/reports', listReports);

// Get specific report details
router.get('/reports/:id', getReportDetails);

// Unhide content
router.post('/reports/:id/unhide', unhideContent);

// Dismiss all reports for content
router.post('/reports/:id/dismiss', dismissReports);

export default router;
