import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Two environments, because the suite has two kinds of test:
//   node  - pure functions (config/endpoints). No DOM needed, and starting
//           jsdom for them is wasted time.
//   jsdom - components and hooks, which need a document. Opt in per file with a
//           `// @vitest-environment jsdom` docblock.
//
// This is what made the debounce hook untestable earlier: with no config, every
// test ran in node, so @testing-library/react could not be used and the only
// available check was clicking through a real browser.
//
// Note: `environmentMatchGlobs` would be the obvious way to map paths to
// environments, but it was removed in Vitest 4 and silently does nothing.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
  },
});
