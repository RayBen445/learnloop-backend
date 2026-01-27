/**
 * Posts Controller
 * 
 * CRUD operations for posts with strict validation.
 * Phase 3: Posts only (no comments, votes, or saves yet).
 */

import prisma from '../../prisma.js';
import { isOwner } from '../middleware/authMiddleware.js';

// Constants
const MIN_WORDS = 80;
const MAX_WORDS = 220;
const MAX_TITLE_LENGTH = 60;

/**
 * Count words in text
 * Words are separated by whitespace.
 */
function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  // Split by whitespace and filter out empty strings
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Validate post content
 * 
 * Validates title, content (word count), and topic ID.
 * 
 * @param {string} title - Post title
 * @param {string} content - Post content
 * @param {number} primaryTopicId - Primary topic ID
 * @returns {{valid: boolean, error?: string, wordCount?: number}} Validation result
 */
function validatePostContent(title, content, primaryTopicId) {
  // Validate title
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'Title is required' };
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0) {
    return { valid: false, error: 'Title cannot be empty' };
  }

  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    return { valid: false, error: `Title must be ${MAX_TITLE_LENGTH} characters or less` };
  }

  // Validate content
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content is required' };
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }

  // Count words
  const wordCount = countWords(trimmedContent);

  if (wordCount < MIN_WORDS) {
    return { 
      valid: false, 
      error: `Content must be at least ${MIN_WORDS} words (currently ${wordCount} words)` 
    };
  }

  if (wordCount > MAX_WORDS) {
    return { 
      valid: false, 
      error: `Content must be at most ${MAX_WORDS} words (currently ${wordCount} words)` 
    };
  }

  // Validate topic ID
  if (!primaryTopicId) {
    return { valid: false, error: 'Primary topic ID is required' };
  }

  const topicId = parseInt(primaryTopicId, 10);
  if (isNaN(topicId) || topicId < 1) {
    return { valid: false, error: 'Invalid topic ID' };
  }

  return { valid: true, wordCount };
}

/**
 * Create a new post
 * 
 * POST /api/posts
 * Requires authentication
 * 
 * Body:
 * - title: string (max 60 chars)
 * - content: string (80-220 words)
 * - primaryTopicId: number
 */
export async function createPost(req, res) {
  try {
    const { title, content, primaryTopicId } = req.body;
    const authorId = req.user.id;

    // Validate input
    const validation = validatePostContent(title, content, primaryTopicId);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    const topicId = parseInt(primaryTopicId, 10);

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found'
      });
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId,
        primaryTopicId: topicId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            learningScore: true
          }
        },
        primaryTopic: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.status(201).json({
      message: 'Post created successfully',
      post,
      wordCount: validation.wordCount
    });

  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({
      error: 'Internal server error while creating post'
    });
  }
}

/**
 * List posts with optional filters
 * 
 * GET /api/posts
 * Query params:
 * - topicId: filter by topic
 * - authorId: filter by author
 * - limit: number of posts (default: 20, max: 100)
 * - offset: pagination offset (default: 0)
 * 
 * No authentication required (public endpoint).
 */
export async function listPosts(req, res) {
  try {
    const { topicId, authorId, limit = 20, offset = 0 } = req.query;

    // Parse and validate pagination
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    // Build where clause
    const where = {
      deletedAt: null // Exclude soft-deleted posts
    };

    if (topicId) {
      const parsedTopicId = parseInt(topicId, 10);
      if (!isNaN(parsedTopicId)) {
        where.primaryTopicId = parsedTopicId;
      }
    }

    if (authorId) {
      where.authorId = authorId;
    }

    // Fetch posts and total count
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              learningScore: true
            }
          },
          primaryTopic: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              comments: true,
              votes: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parsedLimit,
        skip: parsedOffset
      }),
      prisma.post.count({ where })
    ]);

    return res.status(200).json({
      posts,
      pagination: {
        total: totalCount,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < totalCount
      }
    });

  } catch (error) {
    console.error('List posts error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching posts'
    });
  }
}

/**
 * Get single post by ID
 * 
 * GET /api/posts/:id
 * No authentication required (public endpoint).
 */
export async function getPostById(req, res) {
  try {
    const { id } = req.params;

    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({
        error: 'Invalid post ID format'
      });
    }

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null // Exclude soft-deleted posts
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            learningScore: true,
            createdAt: true
          }
        },
        primaryTopic: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        _count: {
          select: {
            comments: true,
            votes: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    return res.status(200).json({ post });

  } catch (error) {
    console.error('Get post by ID error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching post'
    });
  }
}

/**
 * Get posts by topic
 * 
 * GET /api/posts/topic/:topicId
 * No authentication required (public endpoint).
 */
export async function getPostsByTopic(req, res) {
  try {
    const { topicId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const parsedTopicId = parseInt(topicId, 10);
    if (isNaN(parsedTopicId)) {
      return res.status(400).json({
        error: 'Invalid topic ID format'
      });
    }

    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: parsedTopicId }
    });

    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found'
      });
    }

    const where = {
      primaryTopicId: parsedTopicId,
      deletedAt: null
    };

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              learningScore: true
            }
          },
          primaryTopic: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              comments: true,
              votes: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parsedLimit,
        skip: parsedOffset
      }),
      prisma.post.count({ where })
    ]);

    return res.status(200).json({
      topic,
      posts,
      pagination: {
        total: totalCount,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < totalCount
      }
    });

  } catch (error) {
    console.error('Get posts by topic error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching posts'
    });
  }
}

/**
 * Get posts by author
 * 
 * GET /api/posts/author/:authorId
 * No authentication required (public endpoint).
 */
export async function getPostsByAuthor(req, res) {
  try {
    const { authorId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        username: true,
        learningScore: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Author not found'
      });
    }

    const where = {
      authorId,
      deletedAt: null
    };

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              learningScore: true
            }
          },
          primaryTopic: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              comments: true,
              votes: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parsedLimit,
        skip: parsedOffset
      }),
      prisma.post.count({ where })
    ]);

    return res.status(200).json({
      author: user,
      posts,
      pagination: {
        total: totalCount,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < totalCount
      }
    });

  } catch (error) {
    console.error('Get posts by author error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching posts'
    });
  }
}

/**
 * Update post
 * 
 * PUT /api/posts/:id
 * Requires authentication (author only)
 * 
 * Body:
 * - title: string (optional)
 * - content: string (optional, revalidated if provided)
 * - primaryTopicId: number (optional)
 */
export async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const { title, content, primaryTopicId } = req.body;
    const userId = req.user.id;

    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({
        error: 'Invalid post ID format'
      });
    }

    // Fetch post
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null
      }
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    // Check ownership
    if (!isOwner(userId, post.authorId)) {
      return res.status(403).json({
        error: 'You can only update your own posts'
      });
    }

    // Build update data
    const updateData = {};

    if (title !== undefined) {
      const trimmedTitle = title.trim();
      if (trimmedTitle.length === 0) {
        return res.status(400).json({
          error: 'Title cannot be empty'
        });
      }
      if (trimmedTitle.length > MAX_TITLE_LENGTH) {
        return res.status(400).json({
          error: `Title must be ${MAX_TITLE_LENGTH} characters or less`
        });
      }
      updateData.title = trimmedTitle;
    }

    if (content !== undefined) {
      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        return res.status(400).json({
          error: 'Content cannot be empty'
        });
      }

      const wordCount = countWords(trimmedContent);
      if (wordCount < MIN_WORDS) {
        return res.status(400).json({
          error: `Content must be at least ${MIN_WORDS} words (currently ${wordCount} words)`
        });
      }
      if (wordCount > MAX_WORDS) {
        return res.status(400).json({
          error: `Content must be at most ${MAX_WORDS} words (currently ${wordCount} words)`
        });
      }
      updateData.content = trimmedContent;
    }

    if (primaryTopicId !== undefined) {
      const topicId = parseInt(primaryTopicId, 10);
      if (isNaN(topicId) || topicId < 1) {
        return res.status(400).json({
          error: 'Invalid topic ID'
        });
      }

      // Check if topic exists
      const topic = await prisma.topic.findUnique({
        where: { id: topicId }
      });

      if (!topic) {
        return res.status(404).json({
          error: 'Topic not found'
        });
      }

      updateData.primaryTopicId = topicId;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            learningScore: true
          }
        },
        primaryTopic: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPost
    });

  } catch (error) {
    console.error('Update post error:', error);
    return res.status(500).json({
      error: 'Internal server error while updating post'
    });
  }
}

/**
 * Soft delete post
 * 
 * DELETE /api/posts/:id
 * Requires authentication (author only)
 * 
 * Sets deletedAt timestamp without removing from database.
 */
export async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({
        error: 'Invalid post ID format'
      });
    }

    // Fetch post
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null
      }
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    // Check ownership
    if (!isOwner(userId, post.authorId)) {
      return res.status(403).json({
        error: 'You can only delete your own posts'
      });
    }

    // Soft delete
    await prisma.post.update({
      where: { id: postId },
      data: {
        deletedAt: new Date()
      }
    });

    return res.status(200).json({
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({
      error: 'Internal server error while deleting post'
    });
  }
}
