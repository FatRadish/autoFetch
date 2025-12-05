import { vi } from 'vitest';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.ENCRYPTION_SECRET = 'test-encryption-secret-32chars!';
process.env.NODE_ENV = 'test';

// Mock prisma client
vi.mock('../lib/prisma.js', () => ({
  default: {
    account: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    platform: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock encryption utils
vi.mock('../utils/encrypt.js', () => ({
  encrypt: vi.fn((text: string) => `encrypted_${text}`),
  decrypt: vi.fn((text: string) => text.replace('encrypted_', '')),
}));

// Mock cookie utils
vi.mock('../utils/cookie.js', () => ({
  validateCookies: vi.fn(() => ({ valid: true })),
  parseCookies: vi.fn(() => []),
}));

// Mock config
vi.mock('../config/index.js', () => ({
  default: {
    encryption: {
      secret: 'test-encryption-secret-32chars!',
    },
  },
}));
