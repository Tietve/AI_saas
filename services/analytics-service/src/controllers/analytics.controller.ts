/**
 * Analytics Controller
 * HTTP handlers for analytics APIs
 */

import { Request, Response } from 'express';
import * as userAnalytics from '../services/user-analytics.service';
import * as chatAnalytics from '../services/chat-analytics.service';
import * as revenueAnalytics from '../services/revenue-analytics.service';
import * as providerAnalytics from '../services/provider-analytics.service';

// ==================== USER ANALYTICS ====================

export async function getUserCount(req: Request, res: Response) {
  try {
    const data = await userAnalytics.getUserCount();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getUserGrowth(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters are required'
      });
    }

    const data = await userAnalytics.getUserGrowth(
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getActiveUsers(req: Request, res: Response) {
  try {
    const period = (req.query.period as 'day' | 'week' | 'month') || 'day';
    const data = await userAnalytics.getActiveUsers(period);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getUserSignups(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters are required'
      });
    }

    const data = await userAnalytics.getUserSignups(
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getUserRetention(req: Request, res: Response) {
  try {
    const { cohortDate } = req.query;

    if (!cohortDate) {
      return res.status(400).json({
        success: false,
        error: 'cohortDate query parameter is required'
      });
    }

    const data = await userAnalytics.getUserRetention(cohortDate as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getTopUsers(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await userAnalytics.getTopUsers(limit);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// ==================== CHAT ANALYTICS ====================

export async function getTotalMessages(req: Request, res: Response) {
  try {
    const data = await chatAnalytics.getTotalMessages();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getMessagesByProvider(req: Request, res: Response) {
  try {
    const data = await chatAnalytics.getMessagesByProvider();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getMessagesByModel(req: Request, res: Response) {
  try {
    const data = await chatAnalytics.getMessagesByModel();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getChatActivity(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters are required'
      });
    }

    const data = await chatAnalytics.getChatActivity(
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getResponseTimeByProvider(req: Request, res: Response) {
  try {
    const data = await chatAnalytics.getResponseTimeByProvider();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getConversationStats(req: Request, res: Response) {
  try {
    const data = await chatAnalytics.getConversationStats();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getTokenUsageByPlan(req: Request, res: Response) {
  try {
    const data = await chatAnalytics.getTokenUsageByPlan();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// ==================== REVENUE ANALYTICS ====================

export async function getTotalRevenue(req: Request, res: Response) {
  try {
    const data = await revenueAnalytics.getTotalRevenue();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getMRR(req: Request, res: Response) {
  try {
    const data = await revenueAnalytics.getMRR();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getRevenueOverTime(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters are required'
      });
    }

    const data = await revenueAnalytics.getRevenueOverTime(
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getRevenueByPlan(req: Request, res: Response) {
  try {
    const data = await revenueAnalytics.getRevenueByPlan();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getSubscriptionStats(req: Request, res: Response) {
  try {
    const data = await revenueAnalytics.getSubscriptionStats();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getFailedPayments(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters are required'
      });
    }

    const data = await revenueAnalytics.getFailedPayments(
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getLTVByCohort(req: Request, res: Response) {
  try {
    const data = await revenueAnalytics.getLTVByCohort();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// ==================== PROVIDER ANALYTICS ====================

export async function getProviderUsage(req: Request, res: Response) {
  try {
    const data = await providerAnalytics.getProviderUsage();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getProviderUsageByModel(req: Request, res: Response) {
  try {
    const { provider } = req.params;

    if (!provider) {
      return res.status(400).json({
        success: false,
        error: 'provider parameter is required'
      });
    }

    const data = await providerAnalytics.getProviderUsageByModel(provider);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getProviderUsageOverTime(req: Request, res: Response) {
  try {
    const { startDate, endDate, provider } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters are required'
      });
    }

    const data = await providerAnalytics.getProviderUsageOverTime(
      startDate as string,
      endDate as string,
      provider as string | undefined
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getProviderPerformance(req: Request, res: Response) {
  try {
    const data = await providerAnalytics.getProviderPerformance();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getProviderCostEstimation(req: Request, res: Response) {
  try {
    const data = await providerAnalytics.getProviderCostEstimation();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getProviderUsageByPlan(req: Request, res: Response) {
  try {
    const data = await providerAnalytics.getProviderUsageByPlan();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getPopularModels(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await providerAnalytics.getPopularModels(limit);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
