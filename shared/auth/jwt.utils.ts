import * as jwt from 'jsonwebtoken';

/**
 * JWT Configuration for RS256 Asymmetric Signing
 *
 * SECURITY IMPROVEMENTS:
 * 1. RS256 instead of HS256 - asymmetric signing
 * 2. 15-minute access tokens instead of 7 days
 * 3. Separate refresh tokens with 7-day lifespan
 * 4. Private key ONLY in auth-service
 * 5. Public key distributed to all services for verification
 */

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface VerifiedToken {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export class JWTService {
  private privateKey: string | null = null;
  private publicKey: string;

  constructor() {
    // Public key for verification (available to all services)
    this.publicKey = this.loadPublicKey();

    // Private key for signing (ONLY in auth-service)
    if (process.env.JWT_PRIVATE_KEY) {
      this.privateKey = this.loadPrivateKey();
    }
  }

  /**
   * Load public key from environment variable
   */
  private loadPublicKey(): string {
    const publicKeyEnv = process.env.JWT_PUBLIC_KEY;

    if (!publicKeyEnv) {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_PUBLIC_KEY environment variable is not set. ' +
        'This is required for JWT token verification.'
      );
    }

    // Decode base64 if needed
    try {
      return Buffer.from(publicKeyEnv, 'base64').toString('utf-8');
    } catch {
      // If not base64, assume it's the raw key
      return publicKeyEnv;
    }
  }

  /**
   * Load private key from environment variable (auth-service only)
   */
  private loadPrivateKey(): string {
    const privateKeyEnv = process.env.JWT_PRIVATE_KEY;

    if (!privateKeyEnv) {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_PRIVATE_KEY environment variable is not set. ' +
        'This is required for JWT token signing in auth-service.'
      );
    }

    // Decode base64 if needed
    try {
      return Buffer.from(privateKeyEnv, 'base64').toString('utf-8');
    } catch {
      // If not base64, assume it's the raw key
      return privateKeyEnv;
    }
  }

  /**
   * Generate access token (15 minutes lifespan)
   * ONLY callable from auth-service
   */
  generateAccessToken(userId: string, email: string): string {
    if (!this.privateKey) {
      throw new Error(
        'Cannot generate tokens: JWT_PRIVATE_KEY not available. ' +
        'Token generation should only happen in auth-service.'
      );
    }

    const payload: TokenPayload = {
      userId,
      email,
      type: 'access'
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: '15m' // 15 minutes - CRITICAL SECURITY FIX
    });
  }

  /**
   * Generate refresh token (7 days lifespan)
   * ONLY callable from auth-service
   */
  generateRefreshToken(userId: string, email: string): string {
    if (!this.privateKey) {
      throw new Error(
        'Cannot generate tokens: JWT_PRIVATE_KEY not available. ' +
        'Token generation should only happen in auth-service.'
      );
    }

    const payload: TokenPayload = {
      userId,
      email,
      type: 'refresh'
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: '7d' // 7 days
    });
  }

  /**
   * Verify token signature (all services)
   * Uses public key - safe for all services
   */
  verifyToken(token: string): VerifiedToken | null {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256']
      }) as VerifiedToken;

      return decoded;
    } catch (error: any) {
      console.error('[JWT] Token verification failed:', error.message);
      return null;
    }
  }

  /**
   * Decode token without verification (use with caution)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): number | null {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded?.exp || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const exp = this.getTokenExpiration(token);
    if (!exp) return true;

    return Date.now() >= exp * 1000;
  }
}

// Singleton instance
export const jwtService = new JWTService();
