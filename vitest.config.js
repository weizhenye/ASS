import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      resolveId(source, importer) {
        if (source.endsWith('.css')) {
          return { id: path.resolve(importer, '..', `${source}?inline`) };
        }
        return null;
      },
    },
  ],
  test: {
    include: 'test/test.js',
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [
        { browser: 'chromium' },
      ],
    },
  },
});
