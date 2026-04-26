/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: require('path').join(__dirname, 'tsconfig.json'),
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../elearning-frontend/src/$1',
  },
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
};
