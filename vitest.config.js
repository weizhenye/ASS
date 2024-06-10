import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: 'test/test.js',
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true,
    },
    coverage: {
      provider: 'istanbul',
    },
  },
});
