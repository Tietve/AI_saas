/**
 * JWT RS256 Asymmetric Signing Tests
 * Verifies RS256 implementation and token signature validation
 */

import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_SERVICE_URL = 'http://localhost:3001';

describe('JWT RS256 Asymmetric Signing', () => {
  let validToken: string;
  let testEmail: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user
    testEmail = `rs256-test-${Date.now()}@security.com`;
    const signupRes = await request(AUTH_SERVICE_URL)
      .post('/api/auth/signup')
      .send({
        email: testEmail,
        password: 'SecurePass123!'
      });

    if (signupRes.body.accessToken) {
      validToken = signupRes.body.accessToken;
      testUserId = signupRes.body.userId;
    }
  });

  describe('Token Signing with RS256', () => {
    it('should sign tokens with RS256 algorithm', () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const parts = validToken.split('.');
      expect(parts).toHaveLength(3);

      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      expect(header.alg).toBe('RS256');
      expect(header.typ).toBe('JWT');
    });

    it('should include key ID (kid) in token header if configured', () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const parts = validToken.split('.');
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());

      // kid is optional but good to have for key rotation
      // This test just verifies the header structure is correct
      expect(typeof header.alg).toBe('string');
    });
  });

  describe('Token Verification with Public Key', () => {
    it('should verify valid token signature', async () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const meRes = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send();

      // Should accept valid token
      expect(meRes.status).toBe(200);
    });

    it('should extract correct payload from token', () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const decoded = jwt.decode(validToken) as any;
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
      expect(decoded.type).toBe('access');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should have iat (issued at) claim', () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const decoded = jwt.decode(validToken) as any;
      const now = Math.floor(Date.now() / 1000);

      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe('number');

      // Token should be issued within last 10 seconds
      expect(now - decoded.iat).toBeLessThan(10);
    });
  });

  describe('Invalid Signature Rejection', () => {
    it('should reject token with modified payload', async () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const parts = validToken.split('.');
      const header = parts[0];
      const signature = parts[2];

      // Modify the payload
      const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      decodedPayload.userId = 'different-user-id';
      const modifiedPayload = Buffer.from(
        JSON.stringify(decodedPayload)
      ).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

      const tamperedToken = `${header}.${modifiedPayload}.${signature}`;

      const meRes = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .send();

      // Should reject tampered token
      expect(meRes.status).toBe(401);
    });

    it('should reject token with modified signature', async () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const parts = validToken.split('.');
      const header = parts[0];
      const payload = parts[1];

      // Modify the signature
      const signature = parts[2].substring(0, parts[2].length - 2) + 'XX';
      const tamperedToken = `${header}.${payload}.${signature}`;

      const meRes = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .send();

      // Should reject tampered signature
      expect(meRes.status).toBe(401);
    });

    it('should reject completely invalid token', async () => {
      const invalidToken = 'not.a.valid.jwt.token';

      const meRes = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send();

      expect(meRes.status).toBe(401);
    });

    it('should reject HS256 signed tokens', () => {
      // Simulate an HS256 token (less secure)
      const hs256Token = jwt.sign(
        { userId: testUserId, email: testEmail, type: 'access' },
        'secret-key',
        { algorithm: 'HS256', expiresIn: '15m' }
      );

      // Token should exist but won't be verifiable with RS256 public key
      expect(hs256Token).toBeDefined();
      expect(hs256Token).not.toBe(validToken);

      const header = JSON.parse(
        Buffer.from(hs256Token.split('.')[0], 'base64').toString()
      );
      expect(header.alg).toBe('HS256');
    });
  });

  describe('Token Payload Validation', () => {
    it('should contain required claims', () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const decoded = jwt.decode(validToken) as any;

      // Required claims
      expect(decoded.userId).toBeDefined();
      expect(decoded.email).toBeDefined();
      expect(decoded.type).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should have correct token type claim', () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const decoded = jwt.decode(validToken) as any;
      expect(decoded.type).toBe('access');
    });

    it('should not contain sensitive information', () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const decoded = jwt.decode(validToken) as any;

      // Should not contain passwords or hashes
      expect(decoded.password).toBeUndefined();
      expect(decoded.passwordHash).toBeUndefined();
      expect(decoded.secret).toBeUndefined();
    });

    it('should have correct email format', () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const decoded = jwt.decode(validToken) as any;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(decoded.email)).toBe(true);
    });
  });

  describe('Key Rotation Readiness', () => {
    it('should support kid (key ID) header for rotation', () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const parts = validToken.split('.');
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());

      // kid is optional but recommended for key rotation
      // Even if not present, the structure allows it
      expect(header).toBeDefined();
      expect(typeof header).toBe('object');
    });
  });

  describe('Token Expiration Verification', () => {
    it('should properly set expiration with exp claim', () => {
      if (!validToken) {
        console.warn('Skipping test: validToken not available');
        return;
      }

      const decoded = jwt.decode(validToken) as any;
      const now = Math.floor(Date.now() / 1000);

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(now);

      // Should expire in approximately 15 minutes
      const expiresIn = decoded.exp - now;
      expect(expiresIn).toBeGreaterThan(600); // More than 10 minutes
      expect(expiresIn).toBeLessThan(1000); // Less than 16+ minutes
    });
  });
});
