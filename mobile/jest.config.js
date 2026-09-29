// Jest configuration for the Expo app.
//
// jest-expo's preset provides the React Native transform, module mapping and
// setup. Only the project's own conventions are added here:
//  - `@/` resolves to `src/`, matching tsconfig
//  - tests live beside the code they cover
//  - lucide-react-native is pointed at its CJS build. It ships ESM (.mjs) that
//    jest cannot parse. Mapping is deliberate rather than allowing it through
//    transformIgnorePatterns: overriding that replaces jest-expo's own tuned
//    list, and a partial copy of it breaks expo-modules-core. The CJS build
//    exists for exactly this.
const lucide = 'lucide-react-native';

module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    [`^${lucide}$`]: '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/theme/**',
  ],
};
