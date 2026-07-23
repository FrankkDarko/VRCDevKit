import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/VRCDevKit/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
  },
});
