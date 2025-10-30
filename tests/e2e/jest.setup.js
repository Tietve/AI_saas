// Jest setup file
// Runs before each test file

// Increase timeout for E2E tests
jest.setTimeout(30000);

// Console configuration
console.log('🧪 E2E Test Suite Initialized');
console.log('📝 Test Environment: Node.js');
console.log('🔧 Services: Auth (3001), Chat (3002), Billing (3003)');
console.log('');

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
