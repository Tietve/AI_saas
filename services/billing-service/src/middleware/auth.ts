import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  email?: string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies.session;

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized - No session token'
    });
  }

  try {
    const decoded = jwt.verify(token, config.AUTH_SECRET) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized - Invalid token'
    });
  }
}
