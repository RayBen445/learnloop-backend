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
import contactRoutes from './src/routes/contactRoutes.js';
import { bootstrapSystemUsers } from './src/bootstrap.js';
import { securityHeaders } from './src/middleware/securityHeaders.js';

const app = express();

// Middleware order is critical for proper functionality:
// 1. Trust proxy - Must be first for rate limiting to work behind reverse proxies
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// Health check endpoint - Before CORS for Render health checks
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'LearnLoop Backend is running',
    phase: 'Phase 9: Feed and Discovery',
    timestamp: new Date().toISOString()
  });
});

// CORS Configuration
// 2. CORS - Applied before body parsing for efficient preflight handling
// Dynamic origin function to support:
// - Vercel deployments (https://*.vercel.app including learnloop-frontend.vercel.app)
// - localhost for development only
// - Custom domains via ALLOWED_ORIGINS environment variable (no code changes needed)
// Note: Health check endpoint is before CORS to allow Render health checks
const corsOptions = {
  origin: function (origin, callback) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Allow requests with no origin header (server-to-server, curl, Postman, etc.)
    // These are not subject to CORS as they're not browser-based requests
    if (!origin) {
      return callback(null, true);
    }

    // Build allowed patterns based on environment
    const allowedPatterns = [
      /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/ // Vercel deployments (HTTPS only, allows uppercase and underscores)
    ];

    // Add custom domains from environment variable
    if (process.env.ALLOWED_ORIGINS) {
      const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
      customOrigins.forEach(customOrigin => {
        // Escape special regex characters and create exact match pattern
        const escapedOrigin = customOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        allowedPatterns.push(new RegExp(`^${escapedOrigin}$`));
      });
    }

    // Only allow localhost in development
    if (!isProduction) {
      allowedPatterns.push(
        /^https?:\/\/localhost(:\d+)?$/, // localhost with any port
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/ // 127.0.0.1 with any port
      );
    }

    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));

    if (isAllowed) {
      callback(null, true);
    } else {
      // Log rejected requests with disallowed origin for security monitoring
      console.warn(`CORS: Rejected request from disallowed origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow JSON and auth headers
  optionsSuccessStatus: 200, // Return 200 for OPTIONS preflight requests
  maxAge: 86400 // Cache preflight responses for 24 hours (improves performance)
};

// Apply CORS middleware before all routes
app.use(cors(corsOptions));

// Security headers - Applied early to protect all responses
app.use(securityHeaders);
app.disable('x-powered-by');

// 3. Body parsers - Parse request bodies before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Rate limiting - Applied per-route in individual route files (see src/routes/*)
// 5. Routes - Defined below with route-specific rate limiters

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
app.use('/api/contact', contactRoutes); // Contact form

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
app.listen(PORT, async () => {
  console.log(`🚀 LearnLoop Backend running on port ${PORT}`);
  console.log(`📚 Phase 9: Feed and Discovery`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Bootstrap system users
  await bootstrapSystemUsers();
  console.log(`\n🔐 Auth endpoints:`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/verify-email`);
  console.log(`   POST /api/auth/resend-verification`);
  console.log(`\n⚙️  Settings endpoints:`);
  console.log(`   GET  /api/me (optional auth)`);
  console.log(`   PUT  /api/me (auth required)`);
  console.log(`   PUT  /api/me/password (auth required)`);
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
