import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
  expoConfig,
  {
    rules: {
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    // scripts/ is plain Node CommonJS, not part of the Expo runtime. expo's
    // flat config assumes browser globals, so __dirname and require read as
    // undefined there and no-undef fires on code that runs fine.
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'expo-env.d.ts'],
  },
]);
