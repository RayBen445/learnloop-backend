/**
 * Vercel Serverless Function for LearnLoop Backend
 * 
 * This file wraps the Express app for deployment on Vercel as a serverless function.
 * Vercel automatically detects files in /api directory as serverless functions.
 */

import app from '../server.js';

// Export a handler function for Vercel serverless
// Vercel expects: export default async function handler(req, res) { ... }
export default app;
