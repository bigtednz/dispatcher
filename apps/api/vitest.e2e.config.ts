import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.e2e-spec.ts'],
    testTimeout: 15000,
  },
  resolve: {
    alias: { '@dispatcher/shared': path.resolve(__dirname, '../../packages/shared/src') },
  },
});
