// vitest.config.js
// Standalone test config — does NOT inherit VitePWA or UnoCSS (not needed for unit tests).
// Mirrors only the path aliases used by the test suite.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the engine aliases from vite.config.js so tests resolve them the
    // same way the app does. Array form preserves match order (specific → '@').
    // NOTE: @debuggers points at the tracked production stub (src/debuggers-stub),
    // NOT the dev-only ZZnotforproduction tree — tests must never require any
    // not-for-production artifact.
    alias: [
      {
        find: '@identity',
        replacement: fileURLToPath(new URL('../../engines/identity/index.js', import.meta.url)),
      },
      {
        find: '@hydration',
        replacement: fileURLToPath(new URL('../../engines/hydration/index.js', import.meta.url)),
      },
      {
        find: '@chat',
        replacement: fileURLToPath(new URL('../../engines/chat/index.js', import.meta.url)),
      },
      {
        find: '@reviews',
        replacement: fileURLToPath(new URL('../../engines/reviews/index.js', import.meta.url)),
      },
      {
        find: '@portfolio',
        replacement: fileURLToPath(new URL('../../engines/portfolio/index.js', import.meta.url)),
      },
      {
        find: '@booking',
        replacement: fileURLToPath(new URL('../../engines/booking/index.js', import.meta.url)),
      },
      {
        find: '@media',
        replacement: fileURLToPath(new URL('../../engines/media/index.js', import.meta.url)),
      },
      {
        find: '@notifications',
        replacement: fileURLToPath(new URL('./src/features/notifications/runtime/index.js', import.meta.url)),
      },
      {
        // Tracked production no-op stub — never the ZZnotforproduction tree.
        find: '@debuggers',
        replacement: fileURLToPath(new URL('./src/debuggers-stub', import.meta.url)),
      },
      {
        find: /^@i18n\/(.*)/,
        replacement: fileURLToPath(new URL('../../engines/i18n/$1', import.meta.url)),
      },
      {
        find: '@i18n',
        replacement: fileURLToPath(new URL('../../engines/i18n/index.js', import.meta.url)),
      },
      {
        // Must match vite.config.js and jsconfig.json — @/ → src/
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  test: {
    // Controller tests are pure Node — no DOM needed.
    // Switch to 'jsdom' only when testing components.
    environment: 'node',
    // Include VCSM app tests AND booking engine tests (engine uses relative imports — no alias needed).
    include: [
      'src/**/__tests__/*.test.js',
      '../../engines/booking/src/**/__tests__/*.test.js',
      '../../engines/portfolio/src/**/__tests__/*.test.js',
    ],
  },
})
