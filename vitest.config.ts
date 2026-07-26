import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    globals: true,
  },
});
