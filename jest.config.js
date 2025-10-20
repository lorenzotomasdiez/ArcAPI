/**
 * Jest Configuration
 *
 * Test framework configuration for ARCA API.
 * Supports TypeScript with ts-jest and enforces coverage thresholds.
 *
 * @see https://jestjs.io/docs/configuration
 */

module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Test environment
  testEnvironment: 'node',

  // Root directories for tests
  roots: ['<rootDir>/src'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
  ],

  // Coverage thresholds (enforced - builds fail below these)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: [
    'text',          // Console output
    'text-summary',  // Brief summary
    'html',          // HTML report
    'lcov',          // For CI tools (Codecov, etc.)
    'json',          // Machine-readable
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Reset mocks before each test
  resetMocks: true,

  // Paths to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],

  // Module paths to ignore for coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/__tests__/',
    '/test-utils/',
  ],

  // Setup files to run after environment setup
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setup.ts'],

  // Global test timeout (milliseconds)
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Detect open handles (helps find async issues)
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: false,

  // Max workers for parallel test execution
  // Use 50% of available CPUs for optimal performance
  maxWorkers: '50%',

  // Globals configuration for ts-jest
  globals: {
    'ts-jest': {
      tsconfig: {
        // Allow JS imports in TS files
        allowJs: true,
        // Use ESNext for async/await support
        target: 'ESNext',
      },
    },
  },

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/test-utils/$1',
  },

  // Projects for different test types (optional - uncomment to use)
  // projects: [
  //   {
  //     displayName: 'unit',
  //     testMatch: ['**/*.test.ts'],
  //     testPathIgnorePatterns: ['.integration.test.ts', '.e2e.test.ts'],
  //   },
  //   {
  //     displayName: 'integration',
  //     testMatch: ['**/*.integration.test.ts'],
  //   },
  // ],
};
