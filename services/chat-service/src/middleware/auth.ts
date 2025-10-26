import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  email?: string;
}

/**
 * Verify JWT session from cookie
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies.session;

  if (!token) {
    res.status(401).json({ error: 'Chưa đăng nhập' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.AUTH_SECRET) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Session không hợp lệ hoặc đã hết hạn' });
  }
}
