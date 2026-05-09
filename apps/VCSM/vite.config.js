// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// NOTE: CSP removed for dev per request.

export default defineConfig(({ mode }) => ({
  envDir: '../../',

  resolve: {
    dedupe: ['react', 'react-dom', 'framer-motion', 'zustand'],
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
        find: '@debuggers',
        replacement: mode === 'production'
          ? fileURLToPath(new URL('./src/debuggers-stub', import.meta.url))
          : fileURLToPath(new URL('../../zNOTFORPRODUCTION/_ACTIVE/debuggers', import.meta.url)),
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
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },

  optimizeDeps: {
    entries: [],
    include: ['react', 'react-dom', 'framer-motion', 'zustand'],
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },

  build: { target: 'esnext' },
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : undefined,

  // Make the dev server reachable from your phone
  server: {
    host: true,
    port: 5173,
    hmr: { clientPort: 5173 },
    // headers: {}  // ← no CSP or security headers in dev
  },

  plugins: [
    react(),
    UnoCSS(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        injectionPoint: 'self.__WB_MANIFEST',
        globDirectory: 'dist',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,avif,gif,woff,woff2,ttf,json,webmanifest}'],

        // ✅ allow chunks up to 10 MB to be precached
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      devOptions: { enabled: false },
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Vibez Citizens',
        short_name: 'Vibez',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#a855f7',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
}))
