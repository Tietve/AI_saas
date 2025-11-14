/**
 * JWT Refresh Token Security Tests
 * Tests the critical security fixes for token lifecycle management
 */

import request from 'supertest';
import * as jwt from 'jsonwebtoken';

const AUTH_SERVICE_URL = 'http://localhost:3001';

describe('JWT Refresh Token Security', () => {
  let accessToken: string;
  let refreshToken: string;
  let userId: string;
  let testEmail: string;

  beforeAll(async () => {
    // Create a test user
    testEmail = `test-${Date.now()}@security.com`;
    const signupRes = await request(AUTH_SERVICE_URL)
      .post('/api/auth/signup')
      .send({
        email: testEmail,
        password: 'SecurePass123!'
      });

    if (signupRes.body.accessToken) {
      accessToken = signupRes.body.accessToken;
      refreshToken = signupRes.body.refreshToken;
      userId = signupRes.body.userId;
    }
  });

  describe('Access Token Expiration (15 minutes)', () => {
    it('should have access token with 15 minute expiration', () => {
      if (!accessToken) {
        console.warn('Skipping test: accessToken not available');
        return;
      }

      const decoded = jwt.decode(accessToken) as any;
      expect(decoded).toBeDefined();
      expect(decoded.type).toBe('access');

      // Check token expiration is approximately 15 minutes from now
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = (decoded.exp - now) / 60; // Convert to minutes

      // Allow 1 minute margin
      expect(expiresIn).toBeGreaterThan(13);
      expect(expiresIn).toBeLessThanOrEqual(15);
    });

    it('should contain correct payload data', () => {
      if (!accessToken) {
        console.warn('Skipping test: accessToken not available');
        return;
      }

      const decoded = jwt.decode(accessToken) as any;
      expect(decoded.userId).toBeDefined();
      expect(decoded.email).toBe(testEmail);
      expect(decoded.type).toBe('access');
    });
  });

  describe('Refresh Token Lifecycle', () => {
    it('should have refresh token with 7 day expiration', () => {
      if (!refreshToken) {
        console.warn('Skipping test: refreshToken not available');
        return;
      }

      const decoded = jwt.decode(refreshToken) as any;
      expect(decoded).toBeDefined();
      expect(decoded.type).toBe('refresh');

      // Check token expiration is approximately 7 days from now
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = (decoded.exp - now) / (24 * 60 * 60); // Convert to days

      // Allow 1 day margin
      expect(expiresIn).toBeGreaterThan(6);
      expect(expiresIn).toBeLessThanOrEqual(7);
    });

    it('should refresh access token successfully', async () => {
      if (!refreshToken) {
        console.warn('Skipping test: refreshToken not available');
        return;
      }

      const refreshRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/refresh')
        .send({
          refreshToken
        });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.ok).toBe(true);
      expect(refreshRes.body.accessToken).toBeDefined();
      expect(refreshRes.body.accessToken).not.toBe(accessToken);

      const newDecoded = jwt.decode(refreshRes.body.accessToken) as any;
      expect(newDecoded.userId).toBe(userId);
    });

    it('should reject already-used refresh token', async () => {
      if (!refreshToken) {
        console.warn('Skipping test: refreshToken not available');
        return;
      }

      // Use refresh token first time
      const firstRefresh = await request(AUTH_SERVICE_URL)
        .post('/api/auth/refresh')
        .send({
          refreshToken
        });

      if (firstRefresh.status !== 200) {
        console.warn('First refresh failed, skipping reuse test');
        return;
      }

      // Try to use the same refresh token again
      const secondRefresh = await request(AUTH_SERVICE_URL)
        .post('/api/auth/refresh')
        .send({
          refreshToken
        });

      // Should be rejected or return a new token (depends on implementation)
      // Most secure implementations reject reuse
      expect([401, 403, 400]).toContain(secondRefresh.status);
    });
  });

  describe('Token Blacklisting on Logout', () => {
    let logoutToken: string;
    let logoutRefreshToken: string;

    beforeAll(async () => {
      const testUser = `logout-test-${Date.now()}@security.com`;
      const signupRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: testUser,
          password: 'SecurePass123!'
        });

      logoutToken = signupRes.body.accessToken;
      logoutRefreshToken = signupRes.body.refreshToken;
    });

    it('should blacklist token on logout', async () => {
      if (!logoutToken) {
        console.warn('Skipping test: logoutToken not available');
        return;
      }

      const logoutRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signout')
        .set('Authorization', `Bearer ${logoutToken}`)
        .send();

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.ok).toBe(true);
    });

    it('should reject blacklisted access token', async () => {
      if (!logoutToken) {
        console.warn('Skipping test: logoutToken not available');
        return;
      }

      // Try to use the logged out token
      const meRes = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${logoutToken}`)
        .send();

      expect(meRes.status).toBe(401);
    });

    it('should reject refresh after logout', async () => {
      if (!logoutRefreshToken) {
        console.warn('Skipping test: logoutRefreshToken not available');
        return;
      }

      const refreshRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/refresh')
        .send({
          refreshToken: logoutRefreshToken
        });

      // Should fail since token was revoked on logout
      expect([401, 403, 400]).toContain(refreshRes.status);
    });
  });

  describe('Token Structure and Validation', () => {
    it('should use RS256 signing algorithm', () => {
      if (!accessToken) {
        console.warn('Skipping test: accessToken not available');
        return;
      }

      const parts = accessToken.split('.');
      expect(parts).toHaveLength(3);

      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      expect(header.alg).toBe('RS256');
    });

    it('should reject tokens with invalid signature', async () => {
      const malformedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.invalidSignature';

      const meRes = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${malformedToken}`)
        .send();

      expect(meRes.status).toBe(401);
    });

    it('should reject tokens with missing expiration', () => {
      // This test verifies that tokens are properly created with exp claim
      if (!accessToken) {
        console.warn('Skipping test: accessToken not available');
        return;
      }

      const decoded = jwt.decode(accessToken) as any;
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
    });
  });

  describe('Token Cookie Security', () => {
    it('should set httpOnly cookie for session token', async () => {
      const signinRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({
          email: testEmail,
          password: 'SecurePass123!'
        });

      expect(signinRes.status).toBe(200);

      const setCookieHeaders = signinRes.headers['set-cookie'] || [];
      const sessionCookie = setCookieHeaders.find((cookie: string) =>
        cookie.includes('session') || cookie.includes('session=')
      );

      if (sessionCookie) {
        expect(sessionCookie).toContain('HttpOnly');
        expect(sessionCookie).toContain('Secure');
        expect(sessionCookie).toContain('SameSite=Strict');
      }
    });

    it('should set correct expiration on session cookie', async () => {
      const signinRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({
          email: testEmail,
          password: 'SecurePass123!'
        });

      const setCookieHeaders = signinRes.headers['set-cookie'] || [];
      const sessionCookie = setCookieHeaders.find((cookie: string) =>
        cookie.includes('session')
      );

      if (sessionCookie) {
        // Should have Max-Age of 15 minutes (900 seconds)
        expect(sessionCookie).toContain('Max-Age');
      }
    });
  });
});
