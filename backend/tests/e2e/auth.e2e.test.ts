/**
 * E2E Tests for Auth Service
 * Tests complete authentication flows
 */

import request from 'supertest';
import { setupTestDatabase, teardownTestDatabase, generateTestEmail } from './setup';

const AUTH_SERVICE_URL = 'http://localhost:3001';

describe('Auth Service E2E Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('User Registration Flow', () => {
    it('should complete full signup → verify → login flow', async () => {
      const testEmail = generateTestEmail();
      const testPassword = 'SecurePass123!';
      let sessionCookie: string;

      // Step 1: Signup
      const signupRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(signupRes.status).toBe(200);
      expect(signupRes.body.ok).toBe(true);
      expect(signupRes.body.message).toContain('thành công');

      // Step 2: Login (should work even without verification if REQUIRE_EMAIL_VERIFICATION=false)
      const signinRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(signinRes.status).toBe(200);
      expect(signinRes.body.ok).toBe(true);

      // Extract session cookie
      const cookies = signinRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      sessionCookie = cookies[0];

      // Step 3: Get current user
      const meRes = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.ok).toBe(true);
      expect(meRes.body.user.email).toBe(testEmail);
      expect(meRes.body.user.userId).toBeDefined();

      // Step 4: Signout
      const signoutRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signout')
        .set('Cookie', sessionCookie);

      expect(signoutRes.status).toBe(200);
      expect(signoutRes.body.ok).toBe(true);

      // Step 5: Verify session is cleared
      const meAfterSignoutRes = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      expect(meAfterSignoutRes.status).toBe(401);
    });

    it('should reject duplicate email signup', async () => {
      const testEmail = generateTestEmail();
      const testPassword = 'SecurePass123!';

      // First signup
      await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: testPassword });

      // Duplicate signup
      const duplicateRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: testPassword });

      expect(duplicateRes.status).toBe(400);
      expect(duplicateRes.body.ok).toBe(false);
      expect(duplicateRes.body.error).toContain('đã tồn tại');
    });

    it('should reject weak passwords', async () => {
      const testEmail = generateTestEmail();

      const weakPasswords = ['123', 'password', 'abc', '12345'];

      for (const weakPass of weakPasswords) {
        const res = await request(AUTH_SERVICE_URL)
          .post('/api/auth/signup')
          .send({ email: testEmail, password: weakPass });

        expect(res.status).toBe(400);
        expect(res.body.ok).toBe(false);
      }
    });
  });

  describe('Authentication Flow', () => {
    it('should reject invalid credentials', async () => {
      const testEmail = generateTestEmail();
      const correctPassword = 'CorrectPass123!';

      // Signup
      await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: correctPassword });

      // Try wrong password
      const wrongPassRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({ email: testEmail, password: 'WrongPassword123!' });

      expect(wrongPassRes.status).toBe(401);
      expect(wrongPassRes.body.ok).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@test.com',
          password: 'AnyPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('Account Lockout', () => {
    it('should lock account after 5 failed login attempts', async () => {
      const testEmail = generateTestEmail();
      const correctPassword = 'CorrectPass123!';

      // Signup
      await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: correctPassword });

      // Attempt 5 failed logins
      for (let i = 0; i < 5; i++) {
        await request(AUTH_SERVICE_URL)
          .post('/api/auth/signin')
          .send({ email: testEmail, password: 'WrongPassword!' });
      }

      // 6th attempt should be locked
      const lockedRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({ email: testEmail, password: correctPassword });

      expect(lockedRes.status).toBe(403);
      expect(lockedRes.body.ok).toBe(false);
      expect(lockedRes.body.error).toContain('khóa');
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle forgot password request', async () => {
      const testEmail = generateTestEmail();
      const testPassword = 'OriginalPass123!';

      // Signup
      await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: testPassword });

      // Request password reset
      const forgotRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.ok).toBe(true);
      expect(forgotRes.body.message).toContain('email');
    });

    it('should not reveal if email exists (security)', async () => {
      // Request reset for non-existent email
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' });

      // Should still return success (don't reveal email existence)
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should maintain session across requests', async () => {
      const testEmail = generateTestEmail();
      const testPassword = 'SessionTest123!';

      // Signup & Login
      await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: testPassword });

      const signinRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({ email: testEmail, password: testPassword });

      const sessionCookie = signinRes.headers['set-cookie'][0];

      // Make multiple authenticated requests
      for (let i = 0; i < 3; i++) {
        const meRes = await request(AUTH_SERVICE_URL)
          .get('/api/auth/me')
          .set('Cookie', sessionCookie);

        expect(meRes.status).toBe(200);
        expect(meRes.body.user.email).toBe(testEmail);
      }
    });

    it('should reject requests without session', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('should reject requests with invalid session', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Cookie', 'session=invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on signup', async () => {
      const requests = [];

      // Try to signup 10 times rapidly (limit is 5/hour)
      for (let i = 0; i < 10; i++) {
        const promise = request(AUTH_SERVICE_URL)
          .post('/api/auth/signup')
          .send({
            email: `ratelimit-${i}@test.com`,
            password: 'Test123456'
          });
        requests.push(promise);
      }

      const responses = await Promise.all(requests);

      // At least some should be rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
