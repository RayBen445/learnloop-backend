/**
 * Settings Controller
 * 
 * Minimal account settings endpoints for authenticated users.
 * Allows users to view and update their own profile information.
 */

import prisma from '../../prisma.js';

// Validation constants
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;
const MAX_BIO_LENGTH = 160;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

/**
 * Get current authenticated user's profile
 * 
 * GET /api/me
 * Requires authentication
 * 
 * Returns current user's profile information:
 * - id, username, bio, learningScore, createdAt
 */
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        bio: true,
        learningScore: true,
        createdAt: true
        // Explicitly exclude: email, hashedPassword, isAdmin
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Your account could not be found.',
        code: 'USER_NOT_FOUND'
      });
    }

    return res.status(200).json({ user });

  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching user',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * Validate username
 * 
 * Rules:
 * - 3-30 characters
 * - Alphanumeric + underscores only
 * 
 * @param {string} username - Username to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateUsername(username) {
  if (typeof username !== 'string') {
    return { valid: false, error: 'Username must be a string' };
  }

  const trimmed = username.trim();

  if (trimmed.length < MIN_USERNAME_LENGTH) {
    return { valid: false, error: `Username must be at least ${MIN_USERNAME_LENGTH} characters` };
  }

  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return { valid: false, error: `Username must be at most ${MAX_USERNAME_LENGTH} characters` };
  }

  if (!USERNAME_REGEX.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  return { valid: true };
}

/**
 * Validate bio
 * 
 * Rules:
 * - Max 160 characters
 * - Can be null/empty
 * 
 * @param {string|null} bio - Bio to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateBio(bio) {
  // Bio is optional
  if (bio === null || bio === undefined) {
    return { valid: true };
  }

  if (typeof bio !== 'string') {
    return { valid: false, error: 'Bio must be a string' };
  }

  const trimmed = bio.trim();

  if (trimmed.length > MAX_BIO_LENGTH) {
    return { valid: false, error: `Bio must be at most ${MAX_BIO_LENGTH} characters` };
  }

  return { valid: true };
}

/**
 * Update current user's profile
 * 
 * PUT /api/me
 * Requires authentication
 * 
 * Body (all optional):
 * - username: string (3-30 chars, alphanumeric + underscores)
 * - bio: string (max 160 chars) or null
 * 
 * Returns updated user profile
 */
export async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { username, bio } = req.body;

    // Build update data object
    const updateData = {};

    // Validate and add username if provided
    if (username !== undefined) {
      const validation = validateUsername(username);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
          message: validation.error,
          code: 'INVALID_USERNAME'
        });
      }

      const trimmedUsername = username.trim();

      // Check if username is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { username: trimmedUsername }
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          error: 'Username is already taken',
          message: 'This username is already in use. Please choose a different username.',
          code: 'USERNAME_EXISTS'
        });
      }

      updateData.username = trimmedUsername;
    }

    // Validate and add bio if provided
    if (bio !== undefined) {
      const validation = validateBio(bio);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
          message: validation.error,
          code: 'INVALID_BIO'
        });
      }

      // Allow null or trimmed bio
      updateData.bio = bio === null ? null : bio.trim();
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No fields to update. Provide username or bio.',
        message: 'Please provide at least one field to update.',
        code: 'NO_FIELDS_TO_UPDATE'
      });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        bio: true,
        learningScore: true,
        createdAt: true
        // Explicitly exclude: email, hashedPassword, isAdmin
      }
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Username is already taken',
        message: 'This username is already in use. Please choose a different username.',
        code: 'USERNAME_EXISTS'
      });
    }

    return res.status(500).json({
      error: 'Internal server error while updating profile',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'SERVER_ERROR'
    });
  }
}
