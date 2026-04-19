const path = require('path');
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TEST_DIR = path.resolve(__dirname, '..');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  rootDir: PROJECT_ROOT,

  // ts-jest transform — trỏ tuyệt đối vì rootDir không chứa node_modules của test/
  transform: {
    '^.+\\.tsx?$': [
      path.join(TEST_DIR, 'node_modules/ts-jest'),
      { tsconfig: path.join(TEST_DIR, 'tsconfig.json') },
    ],
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/elearning-frontend/src/$1',
  },

  // Chỉ chạy test của STT19
  testMatch: ['<rootDir>/test/STT19/**/*.test.ts'],

  clearMocks: true,

  // Coverage settings
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],

  // File nguồn cần đo — relative to rootDir (PROJECT_ROOT)
  collectCoverageFrom: [
    'elearning-frontend/src/apis/exams.ts',
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
