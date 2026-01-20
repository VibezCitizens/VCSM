// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// NOTE: CSP removed for dev per request.

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },

  optimizeDeps: {
    entries: [],
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },

  build: { target: 'esnext' },

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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],

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
})
