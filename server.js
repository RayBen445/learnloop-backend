/**
 * LearnLoop Backend Server
 * 
 * Phase 7: Rate Limiting and Abuse Protection
 * A human-first learning social app for students.
 */

import 'dotenv/config';
import express from 'express';
import authRoutes from './src/routes/authRoutes.js';
import topicsRoutes from './src/routes/topicsRoutes.js';
import postsRoutes from './src/routes/postsRoutes.js';
import commentsRoutes from './src/routes/commentsRoutes.js';
import votesRoutes from './src/routes/votesRoutes.js';
import savedPostsRoutes from './src/routes/savedPostsRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'LearnLoop Backend is running',
    phase: 'Phase 7: Rate Limiting and Abuse Protection',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/votes', votesRoutes);
app.use('/api/saved-posts', savedPostsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LearnLoop Backend running on port ${PORT}`);
  console.log(`📚 Phase 7: Rate Limiting and Abuse Protection`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`\n🔐 Auth endpoints:`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`\n📂 Topics endpoints:`);
  console.log(`   GET  /api/topics`);
  console.log(`   GET  /api/topics/:id`);
  console.log(`   GET  /api/topics/by-name/:name`);
  console.log(`\n📝 Posts endpoints:`);
  console.log(`   POST   /api/posts (auth required)`);
  console.log(`   GET    /api/posts`);
  console.log(`   GET    /api/posts/:id`);
  console.log(`   GET    /api/posts/:postId/comments`);
  console.log(`   GET    /api/posts/topic/:topicId`);
  console.log(`   GET    /api/posts/author/:authorId`);
  console.log(`   PUT    /api/posts/:id (auth required)`);
  console.log(`   DELETE /api/posts/:id (auth required)`);
  console.log(`\n💬 Comments endpoints:`);
  console.log(`   POST   /api/comments (auth required)`);
  console.log(`   GET    /api/comments/:id`);
  console.log(`   PUT    /api/comments/:id (auth required)`);
  console.log(`   DELETE /api/comments/:id (auth required)`);
  console.log(`\n👍 Votes endpoints:`);
  console.log(`   POST   /api/votes (auth required)`);
  console.log(`   DELETE /api/votes/:id (auth required)`);
  console.log(`   GET    /api/votes/posts/:id (optional auth)`);
  console.log(`   GET    /api/votes/comments/:id (optional auth)`);
  console.log(`\n🔖 Saved Posts endpoints:`);
  console.log(`   POST   /api/saved-posts (auth required)`);
  console.log(`   GET    /api/saved-posts (auth required)`);
  console.log(`   GET    /api/saved-posts/check/:postId (optional auth)`);
  console.log(`   DELETE /api/saved-posts/:postId (auth required)`);
});

export default app;
