/**
 * Admin Middleware - Phase 8
 * Verifies that the authenticated user has admin privileges
 */

/**
 * Middleware to check if user is an admin
 * Requires requireAuth to run first
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};
