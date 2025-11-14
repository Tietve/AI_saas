/**
 * Example Test File
 * Demonstrates how to use MSW mocks in tests
 * This file is for reference only - not part of actual test suite
 */

import { http, HttpResponse } from 'msw';
import { server } from './server';
import { mockUsers, mockTokens } from './fixtures';

describe('MSW Mock Examples', () => {
  describe('Authentication', () => {
    test('successful login returns token and user', async () => {
      // Simulate login request
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe('test@example.com');
    });

    test('failed login returns 401', async () => {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Invalid credentials');
    });

    test('get user with valid token', async () => {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${mockTokens.testUser}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toEqual(
        expect.objectContaining({
          id: mockUsers.testUser.id,
          email: mockUsers.testUser.email,
        })
      );
    });

    test('get user without token returns 401', async () => {
      const response = await fetch('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('Chat', () => {
    test('send message creates conversation', async () => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockTokens.testUser}`,
        },
        body: JSON.stringify({
          message: 'Hello, AI!',
          model: 'gpt-4',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('conversation');
      expect(data).toHaveProperty('userMessage');
      expect(data).toHaveProperty('aiMessage');
      expect(data.userMessage.content).toBe('Hello, AI!');
      expect(data.aiMessage.role).toBe('assistant');
    });

    test('get conversations for user', async () => {
      const response = await fetch('/api/conversations', {
        headers: {
          Authorization: `Bearer ${mockTokens.testUser}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('conversations');
      expect(Array.isArray(data.conversations)).toBe(true);
      expect(data.conversations.length).toBeGreaterThan(0);
    });

    test('delete conversation', async () => {
      const response = await fetch('/api/conversations/conv-1', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${mockTokens.testUser}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('deletedAt');
    });
  });

  describe('Billing', () => {
    test('get all plans', async () => {
      const response = await fetch('/api/billing/plans');

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('plans');
      expect(data.plans.length).toBe(4); // Free, Starter, Pro, Enterprise
    });

    test('get user subscription', async () => {
      const response = await fetch('/api/billing/subscription', {
        headers: {
          Authorization: `Bearer ${mockTokens.testUser}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('subscription');
      expect(data.subscription).toHaveProperty('plan');
    });

    test('create subscription', async () => {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockTokens.testUser}`,
        },
        body: JSON.stringify({
          planId: 'plan-pro',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('subscription');
      expect(data.subscription.plan.id).toBe('plan-pro');
    });

    test('cancel subscription', async () => {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockTokens.testUser}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription.cancelAtPeriodEnd).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('override handler for specific error', async () => {
      // Override the default handler for this test only
      server.use(
        http.post('/api/chat', () => {
          return HttpResponse.json(
            { error: 'Service temporarily unavailable' },
            { status: 503 }
          );
        })
      );

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockTokens.testUser}`,
        },
        body: JSON.stringify({
          message: 'Test message',
        }),
      });

      expect(response.status).toBe(503);
    });

    test('network error simulation', async () => {
      server.use(
        http.get('/api/conversations', () => {
          return HttpResponse.error();
        })
      );

      // In real test, you'd test how your app handles network errors
      await expect(
        fetch('/api/conversations', {
          headers: { Authorization: `Bearer ${mockTokens.testUser}` },
        })
      ).rejects.toThrow();
    });
  });

  describe('Using Fixtures Directly', () => {
    test('access mock user data', () => {
      const user = mockUsers.testUser;

      expect(user).toEqual({
        id: '1',
        email: 'test@example.com',
        username: 'Test User',
        workspaceId: 'workspace-1',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    test('access mock tokens', () => {
      expect(mockTokens.testUser).toBeTruthy();
      expect(mockTokens.testUser).toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });
  });
});
