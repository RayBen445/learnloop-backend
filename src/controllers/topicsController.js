/**
 * Topics Controller
 * 
 * Read-only endpoints for topics.
 * Phase 3: Topics are predefined (admin creation to be added later).
 */

import prisma from '../../prisma.js';

/**
 * List all topics
 * 
 * GET /api/topics
 * 
 * Returns all topics in the system.
 * No authentication required (public endpoint).
 */
export async function listTopics(req, res) {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: { posts: true }
        }
      }
    });

    return res.status(200).json({
      topics,
      count: topics.length
    });

  } catch (error) {
    console.error('List topics error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching topics'
    });
  }
}

/**
 * Get single topic by ID
 * 
 * GET /api/topics/:id
 * 
 * Returns a single topic with post count.
 * No authentication required (public endpoint).
 */
export async function getTopicById(req, res) {
  try {
    const { id } = req.params;

    // Validate ID is a number
    const topicId = parseInt(id, 10);
    if (isNaN(topicId)) {
      return res.status(400).json({
        error: 'Invalid topic ID format'
      });
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: { posts: true }
        }
      }
    });

    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found'
      });
    }

    return res.status(200).json({ topic });

  } catch (error) {
    console.error('Get topic by ID error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching topic'
    });
  }
}

/**
 * Get topic by name
 * 
 * GET /api/topics/by-name/:name
 * 
 * Returns a single topic by name (case-insensitive).
 * No authentication required (public endpoint).
 */
export async function getTopicByName(req, res) {
  try {
    const { name } = req.params;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Topic name is required'
      });
    }

    // Find topic (case-insensitive search)
    const topic = await prisma.topic.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: { posts: true }
        }
      }
    });

    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found'
      });
    }

    return res.status(200).json({ topic });

  } catch (error) {
    console.error('Get topic by name error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching topic'
    });
  }
}
