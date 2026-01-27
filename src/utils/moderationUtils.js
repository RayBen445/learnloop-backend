/**
 * Moderation Utilities - Phase 8
 * Helper functions for handling hidden content visibility
 */

/**
 * Get visibility filter for posts
 * Hidden posts are only visible to:
 * - The author
 * - Admins
 * 
 * @param {Object} user - Current user (null if not authenticated)
 * @param {string} authorId - ID of the content author (optional, for single post view)
 * @returns {Object} Filter object for Prisma queries
 */
export const getPostVisibilityFilter = (user, authorId = null) => {
  // If user is admin, show everything
  if (user && user.isAdmin) {
    return {};
  }

  // If viewing own content, show everything
  if (user && authorId && user.id === authorId) {
    return {};
  }

  // Otherwise, hide hidden content
  return { isHidden: false };
};

/**
 * Get visibility filter for comments
 * Hidden comments are only visible to:
 * - The author
 * - Admins
 * 
 * @param {Object} user - Current user (null if not authenticated)
 * @param {string} authorId - ID of the content author (optional, for single comment view)
 * @returns {Object} Filter object for Prisma queries
 */
export const getCommentVisibilityFilter = (user, authorId = null) => {
  // If user is admin, show everything
  if (user && user.isAdmin) {
    return {};
  }

  // If viewing own content, show everything
  if (user && authorId && user.id === authorId) {
    return {};
  }

  // Otherwise, hide hidden content
  return { isHidden: false };
};

/**
 * Check if user can view hidden content
 * @param {Object} user - Current user
 * @param {string} authorId - Content author ID
 * @returns {boolean}
 */
export const canViewHiddenContent = (user, authorId) => {
  if (!user) return false;
  return user.isAdmin || user.id === authorId;
};
