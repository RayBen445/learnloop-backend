/**
 * Vercel Serverless Function for LearnLoop Backend API
 * 
 * This file handles ALL API requests by routing them through the Express app.
 * Vercel treats files in /api as serverless functions.
 * 
 * This catch-all route handles:
 * - /api/* (all API routes)
 * - /health (health check)
 */

import app from '../server.js';

// Export the Express app directly - Vercel will wrap it automatically
export default app;
