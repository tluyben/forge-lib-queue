// @ts-ignore
// Increase timeout for tests that might take longer
jest.setTimeout(30000);

// Mock process.env for Bull tests
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.REDIS_PASSWORD = process.env.REDIS_PASSWORD || ''; 