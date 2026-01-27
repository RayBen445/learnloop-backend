/**
 * Admin Controller - Phase 8
 * Handles admin moderation actions
 */

import prisma from '../../prisma.js';

/**
 * List all reported content
 */
export const listReports = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const reports = await prisma.report.findMany({
      take: Math.min(parseInt(limit), 100),
      skip: parseInt(offset),
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, username: true }
        },
        post: {
          select: { 
            id: true, 
            title: true, 
            isHidden: true,
            author: {
              select: { id: true, username: true }
            }
          }
        },
        comment: {
          select: { 
            id: true, 
            content: true, 
            isHidden: true,
            author: {
              select: { id: true, username: true }
            },
            post: {
              select: { id: true, title: true }
            }
          }
        }
      }
    });

    // Get report counts for each piece of content
    const reportsWithCounts = await Promise.all(reports.map(async (report) => {
      let reportCount = 0;
      
      if (report.postId) {
        reportCount = await prisma.report.count({
          where: { postId: report.postId }
        });
      } else if (report.commentId) {
        reportCount = await prisma.report.count({
          where: { commentId: report.commentId }
        });
      }

      return {
        ...report,
        totalReports: reportCount
      };
    }));

    return res.json({
      reports: reportsWithCounts,
      pagination: {
        limit: Math.min(parseInt(limit), 100),
        offset: parseInt(offset),
        hasMore: reports.length === Math.min(parseInt(limit), 100)
      }
    });
  } catch (error) {
    console.error('Error listing reports:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

/**
 * Get details of a specific report
 */
export const getReportDetails = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: { id: true, username: true, email: true }
        },
        post: {
          select: { 
            id: true, 
            title: true, 
            content: true,
            isHidden: true,
            deletedAt: true,
            author: {
              select: { id: true, username: true, email: true }
            }
          }
        },
        comment: {
          select: { 
            id: true, 
            content: true,
            isHidden: true,
            author: {
              select: { id: true, username: true, email: true }
            },
            post: {
              select: { id: true, title: true }
            }
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Get all reports for the same content
    let allReports = [];
    if (report.postId) {
      allReports = await prisma.report.findMany({
        where: { postId: report.postId },
        include: {
          reporter: {
            select: { id: true, username: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (report.commentId) {
      allReports = await prisma.report.findMany({
        where: { commentId: report.commentId },
        include: {
          reporter: {
            select: { id: true, username: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return res.json({
      report,
      allReports,
      totalReports: allReports.length
    });
  } catch (error) {
    console.error('Error getting report details:', error);
    return res.status(500).json({ error: 'Failed to fetch report details' });
  }
};

/**
 * Unhide content (admin action)
 */
export const unhideContent = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { postId: true, commentId: true }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Unhide the content
    if (report.postId) {
      await prisma.post.update({
        where: { id: report.postId },
        data: { isHidden: false }
      });

      return res.json({ 
        message: 'Post unhidden successfully',
        postId: report.postId
      });
    } else if (report.commentId) {
      await prisma.comment.update({
        where: { id: report.commentId },
        data: { isHidden: false }
      });

      return res.json({ 
        message: 'Comment unhidden successfully',
        commentId: report.commentId
      });
    }
  } catch (error) {
    console.error('Error unhiding content:', error);
    return res.status(500).json({ error: 'Failed to unhide content' });
  }
};

/**
 * Dismiss all reports for a piece of content (admin action)
 */
export const dismissReports = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { postId: true, commentId: true }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Delete all reports for this content and unhide
    await prisma.$transaction(async (tx) => {
      if (report.postId) {
        await tx.report.deleteMany({
          where: { postId: report.postId }
        });
        await tx.post.update({
          where: { id: report.postId },
          data: { isHidden: false }
        });
      } else if (report.commentId) {
        await tx.report.deleteMany({
          where: { commentId: report.commentId }
        });
        await tx.comment.update({
          where: { id: report.commentId },
          data: { isHidden: false }
        });
      }
    });

    return res.json({ 
      message: 'All reports dismissed and content unhidden',
      postId: report.postId,
      commentId: report.commentId
    });
  } catch (error) {
    console.error('Error dismissing reports:', error);
    return res.status(500).json({ error: 'Failed to dismiss reports' });
  }
};
