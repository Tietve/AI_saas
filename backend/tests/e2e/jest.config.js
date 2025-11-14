module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.e2e.test.ts'],
  collectCoverageFrom: [
    '../../services/**/src/**/*.ts',
    '!../../services/**/src/**/*.d.ts',
    '!../../services/**/src/**/*.test.ts'
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 30000, // 30 seconds per test
  maxWorkers: 1, // Run tests sequentially to avoid conflicts
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
