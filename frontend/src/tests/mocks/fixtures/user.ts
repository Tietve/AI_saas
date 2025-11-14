/**
 * Mock User Data Fixtures
 */

export interface MockUser {
  id: string;
  email: string;
  username: string;
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockUsers: Record<string, MockUser> = {
  testUser: {
    id: '1',
    email: 'test@example.com',
    username: 'Test User',
    workspaceId: 'workspace-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  premiumUser: {
    id: '2',
    email: 'premium@example.com',
    username: 'Premium User',
    workspaceId: 'workspace-2',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  adminUser: {
    id: '3',
    email: 'admin@example.com',
    username: 'Admin User',
    workspaceId: 'workspace-3',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
};

export const mockTokens = {
  testUser: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjA5NDU5MjAwLCJleHAiOjE5MjQ4MTkyMDB9.mock-signature',
  premiumUser: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyIiwiZW1haWwiOiJwcmVtaXVtQGV4YW1wbGUuY29tIiwiaWF0IjoxNjA5NDU5MjAwLCJleHAiOjE5MjQ4MTkyMDB9.mock-signature',
  adminUser: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxOTI0ODE5MjAwfS5tb2NrLXNpZ25hdHVyZQ',
};

export const mockRefreshTokens = {
  testUser: 'refresh-token-test-user',
  premiumUser: 'refresh-token-premium-user',
  adminUser: 'refresh-token-admin-user',
};

// Helper function to get user by email
export const getUserByEmail = (email: string): MockUser | undefined => {
  return Object.values(mockUsers).find(user => user.email === email);
};

// Helper function to get user by token
export const getUserByToken = (token: string): MockUser | undefined => {
  const tokenEntry = Object.entries(mockTokens).find(([_, t]) => t === token);
  if (!tokenEntry) return undefined;
  return mockUsers[tokenEntry[0] as keyof typeof mockUsers];
};
