const path = require('path');
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TEST_DIR     = path.resolve(__dirname, '..');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  rootDir: PROJECT_ROOT,
  transform: {
    '^.+\\.tsx?$': [
      path.join(TEST_DIR, 'node_modules/ts-jest'),
      { tsconfig: path.join(TEST_DIR, 'tsconfig.json') },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/elearning-frontend/src/$1',
  },
  testMatch: ['<rootDir>/test/STT20/**/*.test.ts'],
  clearMocks: true,
  
  // Coverage settings
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageDirectory: 'test/STT20/coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  collectCoverageFrom: [
    'elearning-frontend/src/apis/search.ts',
  ],
  
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 90,
      lines: 80,
    },
  },
};
