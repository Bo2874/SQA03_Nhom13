const path = require('path');
const PROJECT_ROOT = path.resolve(__dirname, '../..');  // SQA03_Nhom13/
const TEST_DIR = path.resolve(__dirname, '..');          // test/

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  rootDir: PROJECT_ROOT,

  // ts-jest transform — trỏ tuyệt đối vì rootDir không chứa node_modules
  transform: {
    '^.+\\.tsx?$': [
      path.join(TEST_DIR, 'node_modules/ts-jest'),
      {
        tsconfig: path.join(TEST_DIR, 'tsconfig.json'),
      },
    ],
  },

  // Resolve @/* alias
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/elearning-frontend/src/$1',
  },

  // Chỉ chạy test trong STT17
  testMatch: ['<rootDir>/test/STT17/**/*.test.ts'],

  clearMocks: true,

  // Coverage
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageDirectory: path.join(TEST_DIR, 'STT17/coverage'),

  // File nguồn cần đo — relative to rootDir
  collectCoverageFrom: [
    'elearning-frontend/src/apis/courses.ts',
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
