/**
 * Saved Posts Controller
 * 
 * Phase 6: Saved Posts (Bookmarks for revision)
 * Handles saving and retrieving posts for later review
 */

import prisma from '../../prisma.js';

/**
 * Save a post for later review
 * POST /api/saved-posts
 */
export const savePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    // Verify post exists and is not deleted
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.deletedAt) {
      return res.status(400).json({ error: 'Cannot save a deleted post' });
    }

    // Check if already saved
    const existingSave = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: parseInt(postId)
        }
      }
    });

    if (existingSave) {
      return res.status(409).json({ 
        error: 'Post already saved',
        savedAt: existingSave.savedAt
      });
    }

    // Save the post
    const savedPost = await prisma.savedPost.create({
      data: {
        userId,
        postId: parseInt(postId)
      },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                learningScore: true
              }
            },
            primaryTopic: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Post saved successfully',
      savedPost: {
        savedAt: savedPost.savedAt,
        post: savedPost.post
      }
    });
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
};

/**
 * Remove a saved post
 * DELETE /api/saved-posts/:postId
 */
export const unsavePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Validate input
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Try to delete the saved post (idempotent - no error if not found)
    const deleted = await prisma.savedPost.deleteMany({
      where: {
        userId,
        postId: parseInt(postId)
      }
    });

    if (deleted.count === 0) {
      // Post wasn't saved, but that's OK (idempotent behavior)
      return res.status(200).json({ 
        message: 'Post was not saved or already removed'
      });
    }

    res.status(200).json({ 
      message: 'Post unsaved successfully'
    });
  } catch (error) {
    console.error('Error unsaving post:', error);
    res.status(500).json({ error: 'Failed to unsave post' });
  }
};

/**
 * Get all saved posts for the current user
 * GET /api/saved-posts
 */
export const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    // Get saved posts with post details
    const savedPosts = await prisma.savedPost.findMany({
      where: {
        userId,
        post: {
          deletedAt: null // Exclude soft-deleted posts
        }
      },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                learningScore: true
              }
            },
            primaryTopic: true,
            _count: {
              select: {
                comments: true,
                votes: true
              }
            }
          }
        }
      },
      orderBy: {
        savedAt: 'desc' // Most recent first
      },
      take: limit,
      skip: offset
    });

    // Get total count
    const total = await prisma.savedPost.count({
      where: {
        userId,
        post: {
          deletedAt: null
        }
      }
    });

    res.status(200).json({
      savedPosts: savedPosts.map(sp => ({
        savedAt: sp.savedAt,
        post: sp.post
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    res.status(500).json({ error: 'Failed to fetch saved posts' });
  }
};

/**
 * Check if a post is saved by the current user
 * GET /api/saved-posts/check/:postId
 */
export const checkIfSaved = async (req, res) => {
  try {
    const { postId } = req.params;

    // Validate input
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // If user is not authenticated, return false
    if (!req.user) {
      return res.status(200).json({ 
        isSaved: false,
        postId: parseInt(postId)
      });
    }

    const userId = req.user.id;

    // Check if saved
    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: parseInt(postId)
        }
      }
    });

    res.status(200).json({ 
      isSaved: !!savedPost,
      postId: parseInt(postId),
      savedAt: savedPost?.savedAt || null
    });
  } catch (error) {
    console.error('Error checking if post is saved:', error);
    res.status(500).json({ error: 'Failed to check saved status' });
  }
};
