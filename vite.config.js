// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import Unocss from 'unocss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const withEnv = (mode) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    BASE: env.VITE_BASE || '/',
    SUPABASE_URL: env.VITE_SUPABASE_URL || 'https://example.supabase.co',
    CDN_HOST: env.VITE_CDN_HOST || 'cdn.vibezcitizens.com',
  }
}

export default defineConfig(({ mode }) => {
  const ENV = withEnv(mode)

  return {
    base: ENV.BASE,
    plugins: [
      react(),
      Unocss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          // ensure new SW takes control immediately (prevents stale vendor*)
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
          runtimeCaching: [
            {
              urlPattern: new RegExp(`^https://${ENV.CDN_HOST.replace(/\./g, '\\.')}\\/.*`),
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-assets',
                expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: new RegExp(`^${ENV.SUPABASE_URL.replace(/\./g, '\\.').replace(/\//g, '\\/')}\\/storage\\/v1\\/object\\/public\\/.*`),
              handler: 'CacheFirst',
              options: {
                cacheName: 'supabase-storage',
                expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 14 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: new RegExp(`^${ENV.SUPABASE_URL.replace(/\./g, '\\.').replace(/\//g, '\\/')}\\/.*`),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api',
                networkTimeoutSeconds: 6,
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 10 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          id: '/?source=pwa',
          scope: '/',
          start_url: '/',
          name: 'Vibez Citizens',
          short_name: 'Vibez',
          description: 'Vibez Citizens — real life, real value.',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#000000',
          theme_color: '#a855f7',
          categories: ['social', 'productivity', 'navigation'],
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          screenshots: [
            { src: '/screenshots/home-1080x1920.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow', label: 'Home feed' },
            { src: '/screenshots/map-1920x1080.png', sizes: '1920x1080', type: 'image/png', form_factor: 'wide', label: 'VGrid map' },
          ],
          shortcuts: [
            { name: 'Open Feed', short_name: 'Feed', url: '/feed' },
            { name: 'VGrid', short_name: 'VGrid', url: '/grid' },
            { name: 'Messages', short_name: 'DMs', url: '/messages' },
          ],
          handle_links: 'preferred',
        },
        devOptions: {
          enabled: process.env.VITE_PWA_DEV === 'true',
          suppressWarnings: true,
          navigateFallback: 'index.html',
        },
      }),
    ],

    resolve: {
      alias: { '@': '/src' },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      // guarantee single React instance across the graph
      dedupe: ['react', 'react-dom'],
    },

    optimizeDeps: {
      // prebundle so React is definitely in vendor
      include: ['react', 'react-dom'],
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
    },

    build: {
      target: 'es2020',
      // turn on source maps once to pinpoint offending module if needed
      sourcemap: mode === 'development' ? true : false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        // keep ffmpeg WASM external if you prefer; do NOT add react/react-dom here
        external: ['@ffmpeg/core'],
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react'
              if (id.includes('supabase')) return 'vendor-supabase'
              if (id.includes('maplibre') || id.includes('leaflet') || id.includes('mapbox')) return 'vendor-maps'
              return 'vendor'
            }
          },
        },
      },
    },

    server: { port: 5173, strictPort: true, host: '0.0.0.0' },
    preview: { port: 4173, strictPort: true },

    define: {
      'process.env': {},
      __APP_ENV__: JSON.stringify(mode),
    },

    esbuild: { jsx: 'automatic' },
  }
})
