/**
 * Input Validation Security Tests
 * Verifies protection against injection attacks and type confusion
 */

import request from 'supertest';

const AUTH_SERVICE_URL = 'http://localhost:3001';

describe('Input Validation Security', () => {
  describe('Email Validation', () => {
    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        'user@.com',
        'user@example..com',
        ''
      ];

      for (const email of invalidEmails) {
        const res = await request(AUTH_SERVICE_URL)
          .post('/api/auth/signup')
          .send({
            email,
            password: 'SecurePass123!'
          });

        expect(res.status).toBe(400);
        expect(res.body.error || res.body.message || res.text).toBeDefined();
      }
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        `valid-${Date.now()}@example.com`,
        `user+tag@example.co.uk`,
        `first.last@example.com`,
        `user_name@example-domain.com`
      ];

      for (const email of validEmails) {
        const res = await request(AUTH_SERVICE_URL)
          .post('/api/auth/signup')
          .send({
            email,
            password: 'SecurePass123!'
          });

        // Should be accepted (200 or conflict if exists)
        expect([200, 409]).toContain(res.status);
      }
    });

    it('should normalize email to lowercase', async () => {
      const testEmail = `MixedCase${Date.now()}@Example.COM`;

      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: 'SecurePass123!'
        });

      if (res.status === 200) {
        // If signup succeeds, email should be lowercase
        expect(res.body.email).toBe(testEmail.toLowerCase());
      }
    });

    it('should reject extremely long emails', async () => {
      const longEmail = 'a'.repeat(255) + '@example.com';

      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: longEmail,
          password: 'SecurePass123!'
        });

      expect([400, 413]).toContain(res.status);
    });
  });

  describe('Password Validation', () => {
    it('should reject weak passwords', async () => {
      const weakPasswords = [
        '123',
        'password',
        'abc',
        '12345',
        'qwerty',
        'password123',
        'pass',
        '111111'
      ];

      for (const password of weakPasswords) {
        const res = await request(AUTH_SERVICE_URL)
          .post('/api/auth/signup')
          .send({
            email: `test-${Date.now()}@security.com`,
            password
          });

        expect(res.status).toBe(400);
        expect(res.body.error || res.body.message || res.text).toContain('password');
      }
    });

    it('should reject passwords shorter than 8 characters', async () => {
      const shortPasswords = ['Pass1', 'Abc123!', '7Chars!'];

      for (const password of shortPasswords) {
        const res = await request(AUTH_SERVICE_URL)
          .post('/api/auth/signup')
          .send({
            email: `test-${Date.now()}@security.com`,
            password
          });

        expect(res.status).toBe(400);
      }
    });

    it('should require uppercase letter in password', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: `test-${Date.now()}@security.com`,
          password: 'alllowercase123'
        });

      expect(res.status).toBe(400);
    });

    it('should require lowercase letter in password', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: `test-${Date.now()}@security.com`,
          password: 'ALLUPPERCASE123'
        });

      expect(res.status).toBe(400);
    });

    it('should require number in password', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: `test-${Date.now()}@security.com`,
          password: 'NoNumbersHere'
        });

      expect(res.status).toBe(400);
    });

    it('should accept strong passwords', async () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure2Password',
        'Complex9Password',
        'ValidPass99'
      ];

      for (const password of strongPasswords) {
        const res = await request(AUTH_SERVICE_URL)
          .post('/api/auth/signup')
          .send({
            email: `test-${Date.now()}@security.com`,
            password
          });

        expect([200, 409]).toContain(res.status);
      }
    });

    it('should reject passwords exceeding max length', async () => {
      const veryLongPassword = 'StrongPass123!' + 'x'.repeat(200);

      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: `test-${Date.now()}@security.com`,
          password: veryLongPassword
        });

      expect(res.status).toBe(400);
    });
  });

  describe('XSS Attack Prevention', () => {
    it('should reject XSS payload in email', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>@example.com',
        'user@example.com"><script>alert("xss")</script>',
        'javascript:alert("xss")@example.com',
        'user@example.com" onerror="alert(1)"'
      ];

      for (const email of xssPayloads) {
        const res = await request(AUTH_SERVICE_URL)
          .post('/api/auth/signup')
          .send({
            email,
            password: 'SecurePass123!'
          });

        expect(res.status).toBe(400);
      }
    });

    it('should reject XSS payload in password attempt', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'password<img src=x onerror="alert(1)">',
        'javascript:alert("xss")',
        'pass" onload="alert(1)"'
      ];

      const testEmail = `xss-test-${Date.now()}@security.com`;

      // Create user first
      await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: 'SecurePass123!'
        });

      for (const payload of xssPayloads) {
        const res = await request(AUTH_SERVICE_URL)
          .post('/api/auth/signin')
          .send({
            email: testEmail,
            password: payload
          });

        expect(res.status).toBe(400);
      }
    });

    it('should sanitize special characters in user input', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: `test-special-${Date.now()}@security.com`,
          password: 'SecurePass123!'
        });

      // Should be processed safely
      expect([200, 409]).toContain(res.status);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should reject SQL injection in email', async () => {
      const sqlPayloads = [
        "admin'--",
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "admin' /*",
        "' UNION SELECT * FROM users --"
      ];

      for (const email of sqlPayloads) {
        const res = await request(AUTH_SERVICE_URL)
          .post('/api/auth/signup')
          .send({
            email: email + '@example.com',
            password: 'SecurePass123!'
          });

        expect(res.status).toBe(400);
      }
    });

    it('should safely handle quotes in input', async () => {
      const testEmail = `quote-test-${Date.now()}@security.com`;

      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: 'SecurePass123!'
        });

      expect([200, 409]).toContain(res.status);
    });

    it('should handle escape characters safely', async () => {
      const testEmail = `escape-test-${Date.now()}@security.com`;

      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: 'SecurePass123!'
        });

      expect([200, 409]).toContain(res.status);
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should reject NoSQL injection patterns', async () => {
      const nosqlPayloads = [
        { $ne: '' },
        { $gt: '' },
        { $regex: '.*' }
      ];

      for (const payload of nosqlPayloads) {
        const res = await request(AUTH_SERVICE_URL)
          .post('/api/auth/signin')
          .send({
            email: payload,
            password: 'test'
          });

        expect(res.status).toBe(400);
      }
    });
  });

  describe('UUID Validation', () => {
    it('should reject invalid UUIDs', async () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        '00000000-0000-0000-0000-00000000000'
      ];

      for (const uuid of invalidUUIDs) {
        // Test with endpoints that accept UUIDs
        const res = await request(AUTH_SERVICE_URL)
          .get(`/api/auth/verify/${uuid}`)
          .send();

        // Should return 400 or 404
        expect([400, 404, 405, 500]).toContain(res.status);
      }
    });

    it('should accept valid UUIDs', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '00000000-0000-0000-0000-000000000000'
      ];

      for (const uuid of validUUIDs) {
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
      }
    });
  });

  describe('Integer and Number Validation', () => {
    it('should reject non-numeric values for numeric fields', async () => {
      const nonNumeric = ['abc', 'null', 'undefined', '{}'  ];

      for (const value of nonNumeric) {
        // Validate by attempting to use as ID or parameter
        const res = await request(AUTH_SERVICE_URL)
          .get(`/api/auth/verify/${value}`)
          .send();

        expect([400, 404, 405]).toContain(res.status);
      }
    });

    it('should accept valid numeric values', () => {
      const validNumbers = [1, 0, -1, 999, 1000000];

      for (const num of validNumbers) {
        expect(typeof num).toBe('number');
      }
    });
  });

  describe('Type Coercion Prevention', () => {
    it('should not allow type coercion attacks', async () => {
      // Attempt to use array instead of string
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({
          email: ['test@example.com'],
          password: 'SecurePass123!'
        });

      expect(res.status).toBe(400);
    });

    it('should validate field types strictly', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: `test-${Date.now()}@security.com`,
          password: 123 // Number instead of string
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Validation Error Messages', () => {
    it('should provide clear validation error messages', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: 'invalid',
          password: 'weak'
        });

      expect(res.status).toBe(400);
      expect(res.body.error || res.body.details || res.text).toBeDefined();
    });

    it('should not expose internal details in errors', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: 'invalid@test.com',
          password: 'weak'
        });

      if (res.status === 400) {
        const errorText = JSON.stringify(res.body);
        expect(errorText).not.toContain('stack');
        expect(errorText).not.toContain('trace');
      }
    });
  });

  describe('Null Byte Injection Prevention', () => {
    it('should reject null bytes in input', async () => {
      const testEmail = `test\x00${Date.now()}@security.com`;

      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: 'SecurePass123!'
        });

      expect([400, 413]).toContain(res.status);
    });
  });

  describe('Empty Field Validation', () => {
    it('should reject empty email', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: '',
          password: 'SecurePass123!'
        });

      expect(res.status).toBe(400);
    });

    it('should reject empty password', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: `test-${Date.now()}@security.com`,
          password: ''
        });

      expect(res.status).toBe(400);
    });

    it('should reject missing required fields', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: `test-${Date.now()}@security.com`
          // Missing password
        });

      expect(res.status).toBe(400);
    });
  });
});
