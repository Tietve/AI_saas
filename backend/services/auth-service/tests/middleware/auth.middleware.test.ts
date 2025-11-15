import { Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../../src/middleware/auth.middleware';
import * as jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('jsonwebtoken');

// Mock config
jest.mock('../../src/config/env', () => ({
  config: {
    AUTH_SECRET: 'test-secret-for-testing-purposes-only',
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      cookies: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should successfully authenticate with valid token from cookie', async () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      mockRequest.cookies = {
        session: 'valid-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      await requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(mockRequest.userId).toBe('user-123');
      expect(mockRequest.userEmail).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should successfully authenticate with token from auth_token cookie', async () => {
      const mockDecoded = {
        userId: 'user-456',
        email: 'test2@example.com',
      };

      mockRequest.cookies = {
        auth_token: 'valid-auth-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      await requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-auth-token', expect.any(String));
      expect(mockRequest.userId).toBe('user-456');
      expect(mockRequest.userEmail).toBe('test2@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', async () => {
      mockRequest.cookies = {};

      await requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      mockRequest.cookies = {
        session: 'invalid-token',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      mockRequest.cookies = {
        session: 'expired-token',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for malformed token', async () => {
      mockRequest.cookies = {
        session: 'malformed.token.structure',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should prioritize auth_token cookie over session cookie', async () => {
      const mockDecodedAuthToken = {
        userId: 'user-auth',
        email: 'auth@example.com',
      };

      mockRequest.cookies = {
        session: 'session-token',
        auth_token: 'auth-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedAuthToken);

      await requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('auth-token', expect.any(String));
      expect(mockRequest.userId).toBe('user-auth');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle token with missing userId field', async () => {
      const mockDecoded = {
        email: 'test@example.com',
      };

      mockRequest.cookies = {
        session: 'token-without-userid',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      await requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.userId).toBeUndefined();
      expect(mockRequest.userEmail).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle token with missing email field', async () => {
      const mockDecoded = {
        userId: 'user-123',
      };

      mockRequest.cookies = {
        session: 'token-without-email',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      await requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.userId).toBe('user-123');
      expect(mockRequest.userEmail).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when jwt.verify throws unexpected error', async () => {
      mockRequest.cookies = {
        session: 'problematic-token',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected JWT error');
      });

      await requireAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
