/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../elearning-frontend/src/$1',
  },
  testMatch: ['**/*.test.ts'],
  clearMocks: true,

  collectCoverage: true,
  coverageProvider: 'v8',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
};
