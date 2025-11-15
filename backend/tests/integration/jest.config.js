module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.integration.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/fixtures/**',
    '!setup.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 30000, // 30 seconds per test
  globalSetup: undefined,
  globalTeardown: undefined,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  }
};
