// vitest.config.js
// Standalone test config — does NOT inherit VitePWA or UnoCSS (not needed for unit tests).
// Mirrors only the path aliases used by the test suite.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Must match vite.config.js and jsconfig.json — @/ → src/
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Controller tests are pure Node — no DOM needed.
    // Switch to 'jsdom' only when testing components.
    environment: 'node',
    // Include VCSM app tests AND booking engine tests (engine uses relative imports — no alias needed).
    include: [
      'src/**/__tests__/*.test.js',
      '../../engines/booking/src/**/__tests__/*.test.js',
    ],
  },
})
