/**
 * Quota Middleware
 *
 * Checks user's PDF upload quota before allowing upload
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check if user has remaining PDF upload quota
 */
export const quotaMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      });
      return;
    }

    // Count user's documents
    const documentCount = await prisma.document.count({
      where: {
        userId,
        deletedAt: null,
      },
    });

    // TODO: Get quota from billing service based on user's plan
    // For now, use free tier limit (5 documents)
    const maxDocuments = 5;

    if (documentCount >= maxDocuments) {
      res.status(429).json({
        success: false,
        error: {
          message: `PDF upload quota exceeded (${maxDocuments} max for free tier)`,
          code: 'QUOTA_EXCEEDED',
        },
      });
      return;
    }

    // Pass remaining quota info to controller
    (req as any).quota = {
      used: documentCount,
      limit: maxDocuments,
      remaining: maxDocuments - documentCount,
    };

    next();
  } catch (error) {
    console.error('Quota check error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to check quota',
        code: 'QUOTA_CHECK_FAILED',
      },
    });
  }
};
