// Jest configuration for the Expo app.
//
// jest-expo's preset provides the React Native transform, module mapping and
// setup. Only the project's own conventions are added here:
//  - `@/` resolves to `src/`, matching tsconfig
//  - tests live beside the code they cover
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/theme/**',
  ],
};
