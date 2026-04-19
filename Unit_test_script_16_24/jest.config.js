/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../elearning-frontend/src/$1',
    '^react-hot-toast$': '<rootDir>/__mocks__/react-hot-toast.js',
  },
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
};
