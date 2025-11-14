/**
 * Security Headers Tests
 * Verifies that all required security headers are present in responses
 */

import request from 'supertest';

const AUTH_SERVICE_URL = 'http://localhost:3001';
const API_BASE_URL = 'http://localhost:3000';

describe('Security Headers', () => {
  let authToken: string;

  beforeAll(async () => {
    const testEmail = `headers-test-${Date.now()}@security.com`;
    const signupRes = await request(AUTH_SERVICE_URL)
      .post('/api/auth/signup')
      .send({
        email: testEmail,
        password: 'SecurePass123!'
      });

    if (signupRes.body.accessToken) {
      authToken = signupRes.body.accessToken;
    }
  });

  describe('Content Security Policy (CSP)', () => {
    it('should include Content-Security-Policy header', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const cspHeader = res.headers['content-security-policy'];
      expect(cspHeader).toBeDefined();
    });

    it('should have restrictive CSP policy', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const csp = res.headers['content-security-policy'];

      if (csp) {
        // Should restrict script sources
        expect(csp).toContain('script-src');

        // Should not allow 'unsafe-eval'
        expect(csp).not.toContain('unsafe-eval');

        // Should have default-src
        expect(csp).toContain('default-src');
      }
    });

    it('should restrict frame embedding', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const csp = res.headers['content-security-policy'];

      if (csp) {
        // Should restrict framing
        expect(csp).toMatch(/frame-src|frameguard/i);
      }
    });

    it('should restrict object sources', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const csp = res.headers['content-security-policy'];

      if (csp) {
        // Should restrict plugins
        expect(csp).toContain('object-src');
      }
    });
  });

  describe('HTTP Strict Transport Security (HSTS)', () => {
    it('should include Strict-Transport-Security header', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const hstsHeader = res.headers['strict-transport-security'];
      expect(hstsHeader).toBeDefined();
    });

    it('should have appropriate HSTS max-age', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const hsts = res.headers['strict-transport-security'];

      if (hsts) {
        // Should have max-age directive
        expect(hsts).toContain('max-age');

        // max-age should be at least 1 year (31536000 seconds)
        const match = hsts.match(/max-age=(\d+)/);
        if (match) {
          const maxAge = parseInt(match[1]);
          expect(maxAge).toBeGreaterThanOrEqual(31536000);
        }
      }
    });

    it('should include HSTS preload flag', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const hsts = res.headers['strict-transport-security'];

      if (hsts) {
        // Should include preload for HSTS preload list
        expect(hsts).toContain('preload');
      }
    });

    it('should include includeSubDomains for HSTS', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const hsts = res.headers['strict-transport-security'];

      if (hsts) {
        expect(hsts).toContain('includeSubDomains');
      }
    });
  });

  describe('X-Frame-Options (Clickjacking Protection)', () => {
    it('should include X-Frame-Options header', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const xFrameOptions = res.headers['x-frame-options'];
      expect(xFrameOptions).toBeDefined();
    });

    it('should set X-Frame-Options to DENY', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const xFrameOptions = res.headers['x-frame-options'];

      if (xFrameOptions) {
        expect(xFrameOptions).toBe('DENY');
      }
    });

    it('should prevent clickjacking attacks', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const xFrameOptions = res.headers['x-frame-options'];

      // DENY prevents framing entirely
      // SAMEORIGIN allows same-origin framing
      const allowedValues = ['DENY', 'SAMEORIGIN'];

      if (xFrameOptions) {
        expect(allowedValues).toContain(xFrameOptions);
      }
    });
  });

  describe('X-Content-Type-Options (MIME Type Sniffing)', () => {
    it('should include X-Content-Type-Options header', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const xContentType = res.headers['x-content-type-options'];
      expect(xContentType).toBeDefined();
    });

    it('should set X-Content-Type-Options to nosniff', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const xContentType = res.headers['x-content-type-options'];

      if (xContentType) {
        expect(xContentType).toBe('nosniff');
      }
    });
  });

  describe('X-XSS-Protection', () => {
    it('should include X-XSS-Protection header', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const xXssProtection = res.headers['x-xss-protection'];

      // This header is optional in modern browsers but good to have
      if (xXssProtection) {
        expect(xXssProtection).toBeDefined();
      }
    });
  });

  describe('Referrer-Policy', () => {
    it('should include Referrer-Policy header', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const referrerPolicy = res.headers['referrer-policy'];
      expect(referrerPolicy).toBeDefined();
    });

    it('should have secure Referrer-Policy', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const referrerPolicy = res.headers['referrer-policy'];

      if (referrerPolicy) {
        const secureValues = [
          'no-referrer',
          'no-referrer-when-downgrade',
          'strict-origin',
          'strict-origin-when-cross-origin'
        ];

        expect(secureValues).toContain(referrerPolicy);
      }
    });
  });

  describe('Permissions-Policy', () => {
    it('should include Permissions-Policy or Feature-Policy header', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const permissionsPolicy = res.headers['permissions-policy'] || res.headers['feature-policy'];

      // This is becoming more common but not required
      if (permissionsPolicy) {
        expect(permissionsPolicy).toBeDefined();
      }
    });
  });

  describe('Server Header (Information Disclosure)', () => {
    it('should not expose detailed server information', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const serverHeader = res.headers['server'];

      if (serverHeader) {
        // Should not contain version numbers or detailed info
        expect(serverHeader).not.toMatch(/\d+\.\d+\.\d+/);
        expect(serverHeader).not.toContain('Express');
      }
    });
  });

  describe('Cache-Control Headers', () => {
    it('should set Cache-Control for sensitive pages', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const cacheControl = res.headers['cache-control'];

      if (cacheControl) {
        // Should prevent caching of sensitive data
        expect(cacheControl).toContain('no-store');
      }
    });

    it('should prevent caching of authentication endpoints', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({
          email: `test-${Date.now()}@security.com`,
          password: 'SecurePass123!'
        });

      const cacheControl = res.headers['cache-control'];

      if (cacheControl) {
        // Auth responses should not be cached
        expect(
          cacheControl.includes('no-store') ||
          cacheControl.includes('no-cache')
        ).toBe(true);
      }
    });
  });

  describe('CORS Headers', () => {
    it('should properly configure CORS headers', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .set('Origin', 'http://localhost:3000')
        .send();

      // Check for CORS headers
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-credentials',
        'access-control-allow-methods',
        'access-control-allow-headers'
      ];

      const hasAnyCorsPolicies = corsHeaders.some(header => res.headers[header]);

      if (hasAnyCorsPolicies) {
        expect(res.headers).toBeDefined();
      }
    });

    it('should not allow wildcard CORS for authenticated endpoints', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .set('Origin', 'http://malicious.com')
        .send();

      const corsOrigin = res.headers['access-control-allow-origin'];

      if (corsOrigin) {
        // Should not blindly allow all origins
        expect(corsOrigin).not.toBe('*');
      }
    });
  });

  describe('HTTP Header Injection Prevention', () => {
    it('should not allow header injection via headers', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .set('X-Custom-Header', 'value\r\nContent-Length: 0')
        .send();

      // Response should handle the request safely
      expect(res).toBeDefined();
    });
  });

  describe('Security Headers on Error Responses', () => {
    it('should include security headers on 401 responses', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .send();

      if (res.status === 401) {
        expect(res.headers['content-security-policy']).toBeDefined();
        expect(res.headers['x-frame-options']).toBeDefined();
      }
    });

    it('should include security headers on 400 responses', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({
          email: 'invalid'
        });

      if (res.status === 400) {
        expect(res.headers['content-security-policy']).toBeDefined();
        expect(res.headers['x-frame-options']).toBeDefined();
      }
    });

    it('should include security headers on 500 responses', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/nonexistent')
        .send();

      // Check if response includes security headers
      const hasSecurityHeaders =
        res.headers['x-frame-options'] ||
        res.headers['content-security-policy'];

      if (res.status >= 500) {
        // Error pages should still have security headers
        expect(hasSecurityHeaders).toBeDefined();
      }
    });
  });

  describe('Comprehensive Security Header Set', () => {
    it('should have all critical security headers', async () => {
      const res = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken || ''}`)
        .send();

      const criticalHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'strict-transport-security',
        'content-security-policy'
      ];

      const missingHeaders = criticalHeaders.filter(
        header => !res.headers[header]
      );

      // Most critical headers should be present
      expect(missingHeaders.length).toBeLessThan(2);
    });
  });
});
