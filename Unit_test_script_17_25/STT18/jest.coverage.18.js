const path = require('path');
const PROJECT_ROOT = path.resolve(__dirname, '../..');  // SQA03_Nhom13/
const TEST_DIR     = path.resolve(__dirname, '..');     // test/

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  rootDir: PROJECT_ROOT,   // ← phải là project root để coverage bao quát cả elearning-frontend/

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

  // Chỉ chạy test của STT18
  testMatch: ['<rootDir>/test/STT18/**/*.test.ts'],

  clearMocks: true,

  // Coverage
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageDirectory: path.join(TEST_DIR, 'STT18/coverage'),

  // File nguồn cần đo — relative to rootDir (PROJECT_ROOT)
  collectCoverageFrom: [
    'elearning-frontend/src/apis/enrollments.ts',
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

