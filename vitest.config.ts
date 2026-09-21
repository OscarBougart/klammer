import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The expander and the engine are plain TypeScript and run in node. Nothing
    // under app/ or src/board/ is unit-tested here — that needs a device.
    include: ['scripts/**/*.test.ts', 'src/engine/**/*.test.ts', 'src/content/**/*.test.ts'],
    environment: 'node',
  },
});
