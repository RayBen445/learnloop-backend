/**
 * Users Controller
 * 
 * Read-only public user profile endpoints.
 * No editing, no private data.
 */

import prisma from '../../prisma.js';

/**
 * Get public user info by ID
 * 
 * GET /api/users/:id
 * No authentication required (public endpoint).
 * 
 * Returns only public user information:
 * - id, username, createdAt, learningScore
 * 
 * Does NOT return:
 * - email, hashedPassword, isAdmin (private data)
 */
export async function getUserById(req, res) {
  try {
    const { id } = req.params;

    // Fetch user with strict field selection
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        createdAt: true,
        learningScore: true
        // Explicitly exclude: email, hashedPassword, isAdmin
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    return res.status(200).json({ user });

  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching user'
    });
  }
}
