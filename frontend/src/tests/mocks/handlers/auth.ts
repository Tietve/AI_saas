/**
 * MSW Auth Handlers
 * Mocks authentication endpoints
 */

import { http, HttpResponse, delay } from 'msw';
import { mockUsers, mockTokens, mockRefreshTokens, getUserByEmail, getUserByToken } from '../fixtures/user';

const BASE_URL = '/api/auth';

export const authHandlers = [
  // POST /api/auth/signin - User login
  http.post(`${BASE_URL}/signin`, async ({ request }) => {
    await delay(100); // Simulate network latency

    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return HttpResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = getUserByEmail(email);

    if (!user) {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password (in mock, we accept any password for valid emails)
    // For more realistic tests, check specific passwords
    const validPasswords: Record<string, string> = {
      'test@example.com': 'password123',
      'premium@example.com': 'premium123',
      'admin@example.com': 'admin123',
    };

    if (password !== validPasswords[email]) {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get token based on user email
    const userKey = Object.keys(mockUsers).find(
      key => mockUsers[key as keyof typeof mockUsers].email === email
    ) as keyof typeof mockUsers;

    const token = mockTokens[userKey];
    const refreshToken = mockRefreshTokens[userKey];

    return HttpResponse.json(
      {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          workspaceId: user.workspaceId,
        },
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=604800`, // 7 days
        },
      }
    );
  }),

  // POST /api/auth/signup - User registration
  http.post(`${BASE_URL}/signup`, async ({ request }) => {
    await delay(100);

    const body = await request.json() as { email: string; password: string; username: string };
    const { email, password, username } = body;

    // Validate input
    if (!email || !password || !username) {
      return HttpResponse.json(
        { error: 'Email, password, and username are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return HttpResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create new user (in real app, this would be saved to DB)
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      username,
      workspaceId: `workspace-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newToken = `mock-jwt-token-${Date.now()}`;
    const newRefreshToken = `refresh-token-${Date.now()}`;

    return HttpResponse.json(
      {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          workspaceId: newUser.workspaceId,
        },
      },
      {
        status: 201,
        headers: {
          'Set-Cookie': `refreshToken=${newRefreshToken}; HttpOnly; Path=/; Max-Age=604800`,
        },
      }
    );
  }),

  // GET /api/auth/me - Get current user
  http.get(`${BASE_URL}/me`, async ({ request }) => {
    await delay(50);

    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const user = getUserByToken(token);

    if (!user) {
      return HttpResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        workspaceId: user.workspaceId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }),

  // POST /api/auth/signout - User logout
  http.post(`${BASE_URL}/signout`, async ({ request }) => {
    await delay(50);

    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In real app, would invalidate token in DB/Redis
    return HttpResponse.json(
      { message: 'Signed out successfully' },
      {
        status: 200,
        headers: {
          'Set-Cookie': 'refreshToken=; HttpOnly; Path=/; Max-Age=0', // Clear cookie
        },
      }
    );
  }),

  // POST /api/auth/refresh - Refresh access token
  http.post(`${BASE_URL}/refresh`, async ({ request }) => {
    await delay(50);

    const cookies = request.headers.get('Cookie');
    const refreshToken = cookies?.match(/refreshToken=([^;]+)/)?.[1];

    if (!refreshToken) {
      return HttpResponse.json(
        { error: 'Refresh token required' },
        { status: 401 }
      );
    }

    // Find user by refresh token
    const userKey = Object.entries(mockRefreshTokens).find(
      ([_, token]) => token === refreshToken
    )?.[0] as keyof typeof mockUsers | undefined;

    if (!userKey) {
      return HttpResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    const user = mockUsers[userKey];
    const newToken = mockTokens[userKey];

    return HttpResponse.json({
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        workspaceId: user.workspaceId,
      },
    });
  }),

  // Error scenarios for testing
  // POST /api/auth/signin with server error
  http.post(`${BASE_URL}/signin/error`, async () => {
    await delay(100);
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  // GET /api/auth/me with expired token
  http.get(`${BASE_URL}/me/expired`, async () => {
    await delay(50);
    return HttpResponse.json(
      { error: 'Token expired' },
      { status: 401 }
    );
  }),
];
