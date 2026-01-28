/**
 * LearnLoop Backend Server
 * 
 * Phase 8: Moderation and Quality Control
 * A human-first learning social app for students.
 */

import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/authRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import usersRoutes from './src/routes/usersRoutes.js';
import topicsRoutes from './src/routes/topicsRoutes.js';
import postsRoutes from './src/routes/postsRoutes.js';
import commentsRoutes from './src/routes/commentsRoutes.js';
import votesRoutes from './src/routes/votesRoutes.js';
import savedPostsRoutes from './src/routes/savedPostsRoutes.js';
import reportsRoutes from './src/routes/reportsRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import feedRoutes from './src/routes/feedRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
// Dynamic origin function to support:
// - All Vercel preview deployments (*.vercel.app)
// - localhost for development
// - Future domain changes without code edits
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin matches allowed patterns
    const allowedPatterns = [
      /^https?:\/\/localhost(:\d+)?$/, // localhost with any port
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/, // 127.0.0.1 with any port
      /\.vercel\.app$/ // All Vercel deployments (*.vercel.app)
    ];

    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow JSON and auth headers
  optionsSuccessStatus: 200 // Return 200 for OPTIONS preflight requests
};

// Apply CORS middleware before all routes
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'LearnLoop Backend is running',
    phase: 'Phase 9: Feed and Discovery',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/me', settingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/votes', votesRoutes);
app.use('/api/saved-posts', savedPostsRoutes);
app.use('/api/reports', reportsRoutes); // Phase 8
app.use('/api/admin', adminRoutes); // Phase 8
app.use('/api/feed', feedRoutes); // Phase 9

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
  console.log(`📚 Phase 9: Feed and Discovery`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`\n🔐 Auth endpoints:`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`\n⚙️  Settings endpoints:`);
  console.log(`   GET  /api/me (auth required)`);
  console.log(`   PUT  /api/me (auth required)`);
  console.log(`\n👤 User endpoints:`);
  console.log(`   GET  /api/users/:id`);
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
  console.log(`\n🚨 Moderation endpoints:`);
  console.log(`   POST   /api/reports (auth required)`);
  console.log(`   GET    /api/admin/reports (admin only)`);
  console.log(`   GET    /api/admin/reports/:id (admin only)`);
  console.log(`   POST   /api/admin/reports/:id/unhide (admin only)`);
  console.log(`   POST   /api/admin/reports/:id/dismiss (admin only)`);
  console.log(`\n📰 Feed endpoints:`);
  console.log(`   GET    /api/feed/home (optional auth)`);
  console.log(`   GET    /api/feed/topic/:topicId (optional auth)`);
  console.log(`   GET    /api/feed/author/:authorId (optional auth)`);
});

export default app;
