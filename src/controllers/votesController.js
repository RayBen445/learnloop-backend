/**
 * Votes Controller
 * 
 * Upvote system for posts and comments with learning score updates.
 * Phase 5: Votes and Learning Score only (no downvotes, ranking, or leaderboards).
 */

import prisma from '../../prisma.js';

/**
 * Add upvote to a post or comment
 * 
 * POST /api/votes
 * Requires authentication
 * 
 * Body:
 * - postId: number (optional, required if commentId not provided)
 * - commentId: number (optional, required if postId not provided)
 * 
 * Rules:
 * - Exactly one of postId or commentId must be provided
 * - Cannot vote on own content
 * - Cannot vote twice on same content
 */
export async function addVote(req, res) {
  try {
    const { postId, commentId } = req.body;
    const userId = req.user.id;

    // Validate exactly one of postId or commentId is provided
    if ((!postId && !commentId) || (postId && commentId)) {
      return res.status(400).json({
        error: 'Must provide exactly one of postId or commentId'
      });
    }

    const parsedPostId = postId ? parseInt(postId, 10) : null;
    const parsedCommentId = commentId ? parseInt(commentId, 10) : null;

    // Validate parsed IDs
    if (parsedPostId !== null && isNaN(parsedPostId)) {
      return res.status(400).json({
        error: 'Invalid post ID format'
      });
    }
    if (parsedCommentId !== null && isNaN(parsedCommentId)) {
      return res.status(400).json({
        error: 'Invalid comment ID format'
      });
    }

    // Check if voting on post
    if (parsedPostId !== null) {
      // Fetch post
      const post = await prisma.post.findUnique({
        where: { id: parsedPostId },
        select: { authorId: true, deletedAt: true }
      });

      if (!post || post.deletedAt !== null) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }

      // Prevent self-voting
      if (post.authorId === userId) {
        return res.status(403).json({
          error: 'Cannot vote on your own post'
        });
      }

      // Check for existing vote
      const existingVote = await prisma.vote.findUnique({
        where: {
          userId_postId: {
            userId,
            postId: parsedPostId
          }
        }
      });

      if (existingVote) {
        return res.status(409).json({
          error: 'You have already voted on this post',
          voteId: existingVote.id
        });
      }

      // Create vote and update learning score in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create vote
        const vote = await tx.vote.create({
          data: {
            userId,
            postId: parsedPostId,
            type: 'UPVOTE'
          }
        });

        // Increment author's learning score
        await tx.user.update({
          where: { id: post.authorId },
          data: {
            learningScore: {
              increment: 1
            }
          }
        });

        return vote;
      });

      return res.status(201).json({
        message: 'Vote added successfully',
        vote: result
      });
    }

    // Check if voting on comment
    if (parsedCommentId !== null) {
      // Fetch comment
      const comment = await prisma.comment.findUnique({
        where: { id: parsedCommentId },
        select: { authorId: true }
      });

      if (!comment) {
        return res.status(404).json({
          error: 'Comment not found'
        });
      }

      // Prevent self-voting
      if (comment.authorId === userId) {
        return res.status(403).json({
          error: 'Cannot vote on your own comment'
        });
      }

      // Check for existing vote
      const existingVote = await prisma.vote.findUnique({
        where: {
          userId_commentId: {
            userId,
            commentId: parsedCommentId
          }
        }
      });

      if (existingVote) {
        return res.status(409).json({
          error: 'You have already voted on this comment',
          voteId: existingVote.id
        });
      }

      // Create vote and update learning score in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create vote
        const vote = await tx.vote.create({
          data: {
            userId,
            commentId: parsedCommentId,
            type: 'UPVOTE'
          }
        });

        // Increment author's learning score
        await tx.user.update({
          where: { id: comment.authorId },
          data: {
            learningScore: {
              increment: 1
            }
          }
        });

        return vote;
      });

      return res.status(201).json({
        message: 'Vote added successfully',
        vote: result
      });
    }

  } catch (error) {
    console.error('Add vote error:', error);
    return res.status(500).json({
      error: 'Internal server error while adding vote'
    });
  }
}

/**
 * Remove upvote
 * 
 * DELETE /api/votes/:id
 * Requires authentication (voter only)
 * 
 * Decrements author's learning score.
 */
export async function removeVote(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const voteId = parseInt(id, 10);
    if (isNaN(voteId)) {
      return res.status(400).json({
        error: 'Invalid vote ID format'
      });
    }

    // Fetch vote with related post or comment
    const vote = await prisma.vote.findUnique({
      where: { id: voteId },
      include: {
        post: {
          select: { authorId: true }
        },
        comment: {
          select: { authorId: true }
        }
      }
    });

    if (!vote) {
      return res.status(404).json({
        error: 'Vote not found'
      });
    }

    // Check ownership (only voter can remove their vote)
    if (vote.userId !== userId) {
      return res.status(403).json({
        error: 'You can only remove your own votes'
      });
    }

    // Determine author ID
    const authorId = vote.post ? vote.post.authorId : vote.comment.authorId;

    // Delete vote and update learning score in transaction
    await prisma.$transaction(async (tx) => {
      // Delete vote
      await tx.vote.delete({
        where: { id: voteId }
      });

      // Decrement author's learning score
      await tx.user.update({
        where: { id: authorId },
        data: {
          learningScore: {
            decrement: 1
          }
        }
      });
    });

    return res.status(200).json({
      message: 'Vote removed successfully'
    });

  } catch (error) {
    console.error('Remove vote error:', error);
    return res.status(500).json({
      error: 'Internal server error while removing vote'
    });
  }
}

/**
 * Get votes for a post
 * 
 * GET /api/posts/:id/votes
 * Optional authentication
 * 
 * Returns:
 * - count: total number of votes
 * - hasVoted: whether current user has voted (if authenticated)
 */
export async function getPostVotes(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Optional auth

    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({
        error: 'Invalid post ID format'
      });
    }

    // Check if post exists and is not deleted
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { deletedAt: true }
    });

    if (!post || post.deletedAt !== null) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    // Get vote count
    const count = await prisma.vote.count({
      where: { postId }
    });

    // Check if current user has voted (if authenticated)
    let hasVoted = false;
    let userVoteId = null;
    if (userId) {
      const userVote = await prisma.vote.findUnique({
        where: {
          userId_postId: {
            userId,
            postId
          }
        },
        select: { id: true }
      });
      hasVoted = !!userVote;
      userVoteId = userVote?.id || null;
    }

    return res.status(200).json({
      postId,
      count,
      hasVoted,
      userVoteId
    });

  } catch (error) {
    console.error('Get post votes error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching votes'
    });
  }
}

/**
 * Get votes for a comment
 * 
 * GET /api/comments/:id/votes
 * Optional authentication
 * 
 * Returns:
 * - count: total number of votes
 * - hasVoted: whether current user has voted (if authenticated)
 */
export async function getCommentVotes(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Optional auth

    const commentId = parseInt(id, 10);
    if (isNaN(commentId)) {
      return res.status(400).json({
        error: 'Invalid comment ID format'
      });
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true }
    });

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found'
      });
    }

    // Get vote count
    const count = await prisma.vote.count({
      where: { commentId }
    });

    // Check if current user has voted (if authenticated)
    let hasVoted = false;
    let userVoteId = null;
    if (userId) {
      const userVote = await prisma.vote.findUnique({
        where: {
          userId_commentId: {
            userId,
            commentId
          }
        },
        select: { id: true }
      });
      hasVoted = !!userVote;
      userVoteId = userVote?.id || null;
    }

    return res.status(200).json({
      commentId,
      count,
      hasVoted,
      userVoteId
    });

  } catch (error) {
    console.error('Get comment votes error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching votes'
    });
  }
}
