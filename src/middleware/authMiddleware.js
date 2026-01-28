/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens and attaches authenticated user to request.
 * Phase 2: Basic auth middleware for protecting routes.
 */

import jwt from 'jsonwebtoken';
import prisma from '../../prisma.js';

/**
 * Verify JWT and attach user to request
 * 
 * Requirements:
 * - Verify JWT token from Authorization header
 * - Attach authenticated user to req.user
 * - Reject unauthorized requests cleanly
 * 
 * Usage:
 * import { requireAuth } from './middleware/authMiddleware.js';
 * app.get('/protected', requireAuth, handler);
 */
export async function requireAuth(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'No authorization token provided'
      });
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Invalid authorization header format. Expected: Bearer <token>'
      });
    }

    const token = parts[1];

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token has expired'
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token'
        });
      }
      throw error;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        learningScore: true,
        isAdmin: true,
        isVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    // Attach user to request
    req.user = user;

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error during authentication'
    });
  }
}

/**
 * Optional authentication middleware
 * 
 * Attaches user to request if token is valid, but doesn't reject if missing.
 * Useful for endpoints that work differently for authenticated vs anonymous users.
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Invalid format, continue without user
      req.user = null;
      return next();
    }

    const token = parts[1];

    // Try to verify JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          learningScore: true,
          isAdmin: true,
          isVerified: true,
          createdAt: true
        }
      });

      req.user = user || null;
    } catch (error) {
      // Invalid or expired token, continue without user
      req.user = null;
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
}

/**
 * Authorization helper: Check if user owns resource
 * 
 * Usage in controllers:
 * if (!isOwner(req.user.id, resource.authorId)) {
 *   return res.status(403).json({ error: 'Forbidden' });
 * }
 */
export function isOwner(userId, resourceOwnerId) {
  return userId === resourceOwnerId;
}

/**
 * Require verified email for write operations
 * 
 * Must be used after requireAuth middleware.
 * Prevents unverified users from creating or modifying content.
 * 
 * Usage:
 * import { requireAuth, requireVerified } from './middleware/authMiddleware.js';
 * router.post('/posts', requireAuth, requireVerified, createPost);
 */
export function requireVerified(req, res, next) {
  try {
    // This middleware must be used after requireAuth
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check if user's email is verified
    if (!req.user.isVerified) {
      return res.status(403).json({
        error: 'Email verification required. Please verify your email to perform this action.'
      });
    }

    next();

  } catch (error) {
    console.error('Verified middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error during verification check'
    });
  }
}
