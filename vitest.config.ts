import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Plain TypeScript that runs in node: the expander, the engine, and the
    // board's pure logic. Components and gestures are not tested here —
    // those need a device.
    include: [
      'scripts/**/*.test.ts',
      'src/engine/**/*.test.ts',
      'src/content/**/*.test.ts',
      'src/board/**/*.test.ts',
      'src/store/**/*.test.ts',
      'src/theme/**/*.test.ts',
    ],
    environment: 'node',
  },
});
