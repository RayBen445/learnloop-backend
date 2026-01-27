/**
 * Saved Posts Routes
 * 
 * Phase 6: Saved Posts (Bookmarks for revision)
 */

import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import {
  savePost,
  unsavePost,
  getSavedPosts,
  checkIfSaved
} from '../controllers/savedPostsController.js';

const router = express.Router();

// Save a post (auth required)
router.post('/', requireAuth, savePost);

// Get all saved posts for current user (auth required)
router.get('/', requireAuth, getSavedPosts);

// Check if a post is saved (optional auth)
router.get('/check/:postId', optionalAuth, checkIfSaved);

// Unsave a post (auth required)
router.delete('/:postId', requireAuth, unsavePost);

export default router;
