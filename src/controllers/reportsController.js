/**
 * Reports Controller - Phase 8
 * Handles content reporting and moderation
 */

import prisma from '../../prisma.js';

const REPORT_THRESHOLD = 5; // Number of reports to auto-hide content

/**
 * Report content (post or comment)
 */
export const reportContent = async (req, res) => {
  try {
    const { postId, commentId, reason, details } = req.body;

    // Validate exactly one of postId or commentId
    if ((!postId && !commentId) || (postId && commentId)) {
      return res.status(400).json({ 
        error: 'Exactly one of postId or commentId must be provided' 
      });
    }

    // Validate reason
    const validReasons = ['SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'MISINFORMATION', 'OFF_TOPIC', 'OTHER'];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ 
        error: `Invalid reason. Must be one of: ${validReasons.join(', ')}` 
      });
    }

    // If reporting a post
    if (postId) {
      const post = await prisma.post.findUnique({
        where: { id: parseInt(postId) },
        select: { id: true, deletedAt: true, authorId: true }
      });

      if (!post || post.deletedAt) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Prevent self-reporting
      if (post.authorId === req.user.id) {
        return res.status(403).json({ error: 'Cannot report your own content' });
      }

      // Create report and check if we should auto-hide
      const report = await prisma.$transaction(async (tx) => {
        // Create the report
        const newReport = await tx.report.create({
          data: {
            reporterId: req.user.id,
            postId: parseInt(postId),
            reason,
            details: details || null
          },
          include: {
            reporter: {
              select: { id: true, username: true }
            },
            post: {
              select: { id: true, title: true }
            }
          }
        });

        // Count total reports for this post
        const reportCount = await tx.report.count({
          where: { postId: parseInt(postId) }
        });

        // Auto-hide if threshold reached
        if (reportCount >= REPORT_THRESHOLD) {
          await tx.post.update({
            where: { id: parseInt(postId) },
            data: { isHidden: true }
          });
        }

        return newReport;
      });

      return res.status(201).json({
        message: 'Report submitted successfully',
        report: {
          id: report.id,
          postId: report.postId,
          reason: report.reason,
          createdAt: report.createdAt
        }
      });
    }

    // If reporting a comment
    if (commentId) {
      const comment = await prisma.comment.findUnique({
        where: { id: parseInt(commentId) },
        select: { id: true, authorId: true }
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Prevent self-reporting
      if (comment.authorId === req.user.id) {
        return res.status(403).json({ error: 'Cannot report your own content' });
      }

      // Create report and check if we should auto-hide
      const report = await prisma.$transaction(async (tx) => {
        // Create the report
        const newReport = await tx.report.create({
          data: {
            reporterId: req.user.id,
            commentId: parseInt(commentId),
            reason,
            details: details || null
          },
          include: {
            reporter: {
              select: { id: true, username: true }
            },
            comment: {
              select: { id: true, content: true }
            }
          }
        });

        // Count total reports for this comment
        const reportCount = await tx.report.count({
          where: { commentId: parseInt(commentId) }
        });

        // Auto-hide if threshold reached
        if (reportCount >= REPORT_THRESHOLD) {
          await tx.comment.update({
            where: { id: parseInt(commentId) },
            data: { isHidden: true }
          });
        }

        return newReport;
      });

      return res.status(201).json({
        message: 'Report submitted successfully',
        report: {
          id: report.id,
          commentId: report.commentId,
          reason: report.reason,
          createdAt: report.createdAt
        }
      });
    }
  } catch (error) {
    // Handle duplicate report error
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'You have already reported this content' });
    }
    
    console.error('Error creating report:', error);
    return res.status(500).json({ error: 'Failed to create report' });
  }
};
