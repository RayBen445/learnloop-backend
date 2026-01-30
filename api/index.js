/**
 * Vercel Serverless Function for LearnLoop Backend
 * 
 * This file wraps the Express app for deployment on Vercel.
 * It exports the Express app as a serverless function handler.
 */

import app from '../server.js';

// Export the Express app as a serverless function
export default app;
