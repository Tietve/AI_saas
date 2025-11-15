/**
 * Test User Fixtures
 *
 * Pre-defined test users for integration tests
 */

import { generateTestEmail, generateTestPassword } from '../setup';

export interface TestUser {
  email: string;
  password: string;
  planTier: 'FREE' | 'PLUS' | 'PRO';
  isEmailVerified: boolean;
}

/**
 * Standard test users
 */
export const TEST_USERS: Record<string, TestUser> = {
  FREE_USER: {
    email: generateTestEmail('free-user'),
    password: generateTestPassword(),
    planTier: 'FREE',
    isEmailVerified: true
  },
  PLUS_USER: {
    email: generateTestEmail('plus-user'),
    password: generateTestPassword(),
    planTier: 'PLUS',
    isEmailVerified: true
  },
  PRO_USER: {
    email: generateTestEmail('pro-user'),
    password: generateTestPassword(),
    planTier: 'PRO',
    isEmailVerified: true
  },
  UNVERIFIED_USER: {
    email: generateTestEmail('unverified'),
    password: generateTestPassword(),
    planTier: 'FREE',
    isEmailVerified: false
  }
};

/**
 * Create a fresh test user with unique credentials
 */
export function createFreshTestUser(planTier: 'FREE' | 'PLUS' | 'PRO' = 'FREE'): TestUser {
  return {
    email: generateTestEmail(),
    password: generateTestPassword(),
    planTier,
    isEmailVerified: true
  };
}

/**
 * Test user quotas based on plan tier
 */
export const PLAN_QUOTAS = {
  FREE: {
    monthlyTokenQuota: 100000,
    documentsQuota: 5,
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },
  PLUS: {
    monthlyTokenQuota: 500000,
    documentsQuota: 50,
    maxFileSize: 50 * 1024 * 1024 // 50MB
  },
  PRO: {
    monthlyTokenQuota: -1, // Unlimited
    documentsQuota: 100,
    maxFileSize: 100 * 1024 * 1024 // 100MB
  }
};
