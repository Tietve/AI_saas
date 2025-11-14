import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.auth_token || req.cookies.session;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Verify token
    const secret = config.AUTH_SECRET || 'default-secret-change-in-production';
    const decoded = jwt.verify(token, secret) as any;

    // Attach user info to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
