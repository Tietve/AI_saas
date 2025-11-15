import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

export interface UserFixtureOptions {
  email?: string;
  username?: string;
  password?: string;
  name?: string;
  planTier?: 'FREE' | 'PLUS' | 'PRO' | 'ENTERPRISE';
  isEmailVerified?: boolean;
  monthlyTokenUsed?: number;
}

/**
 * Creates a user fixture with realistic data
 * @param overrides - Optional overrides for user properties
 * @returns User data ready for database insertion
 */
export async function createUserFixture(overrides: UserFixtureOptions = {}) {
  const email = overrides.email || faker.internet.email().toLowerCase();
  const password = overrides.password || 'Test123!';
  const passwordHash = await bcrypt.hash(password, 10);

  return {
    email,
    emailLower: email.toLowerCase(),
    username: overrides.username || faker.internet.userName().toLowerCase(),
    passwordHash,
    name: overrides.name || faker.person.fullName(),
    avatar: faker.image.avatar(),
    isEmailVerified: overrides.isEmailVerified ?? true,
    emailVerifiedAt: overrides.isEmailVerified !== false ? new Date() : null,
    planTier: overrides.planTier || 'FREE',
    monthlyTokenUsed: overrides.monthlyTokenUsed ?? faker.number.int({ min: 0, max: 10000 }),
    failedLoginAttempts: 0,
    lastFailedLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: faker.date.recent({ days: 7 })
  };
}

/**
 * Creates multiple user fixtures
 * @param count - Number of users to create
 * @param overrides - Optional overrides applied to all users
 * @returns Array of user data
 */
export async function createManyUserFixtures(
  count: number,
  overrides: UserFixtureOptions = {}
) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createUserFixture({
      ...overrides,
      email: overrides.email || `test${i + 1}@example.com`
    });
    users.push(user);
  }
  return users;
}

/**
 * Creates a verified user fixture (convenience function)
 */
export async function createVerifiedUserFixture(overrides: UserFixtureOptions = {}) {
  return createUserFixture({ ...overrides, isEmailVerified: true });
}

/**
 * Creates a PRO tier user fixture (convenience function)
 */
export async function createProUserFixture(overrides: UserFixtureOptions = {}) {
  return createUserFixture({ ...overrides, planTier: 'PRO', isEmailVerified: true });
}

/**
 * Creates a PLUS tier user fixture (convenience function)
 */
export async function createPlusUserFixture(overrides: UserFixtureOptions = {}) {
  return createUserFixture({ ...overrides, planTier: 'PLUS', isEmailVerified: true });
}

/**
 * Creates a FREE tier user fixture (convenience function)
 */
export async function createFreeUserFixture(overrides: UserFixtureOptions = {}) {
  return createUserFixture({ ...overrides, planTier: 'FREE' });
}
