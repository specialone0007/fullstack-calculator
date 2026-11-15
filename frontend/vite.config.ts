import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    // The backend runs on its own port. Proxying /api keeps the browser on
    // one origin, so the backend needs no CORS headers.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      include: ['src/**'],
      exclude: ['src/main.tsx', 'src/**/*.test.{ts,tsx}', 'src/test/**'],
      reporter: ['text'],
      thresholds: { lines: 90 },
    },
  },
})
