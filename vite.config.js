// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import Unocss from 'unocss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Small helper to safely read env in both dev/prod
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
    base: ENV.BASE, // e.g. '/' or '/app/'
    plugins: [
      react(),
      Unocss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
          runtimeCaching: [
            // Cache your public CDN assets (Cloudflare R2)
            {
              urlPattern: new RegExp(`^https://(${ENV.CDN_HOST.replace(/\./g, '\\.')})/.*`),
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-assets',
                expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30d
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Cache Supabase storage objects (public buckets) if you serve them directly
            {
              urlPattern: new RegExp(`^${ENV.SUPABASE_URL.replace(/\./g, '\\.').replace(/\//g, '\\/')}\\/storage\\/v1\\/object\\/public\\/.*`),
              handler: 'CacheFirst',
              options: {
                cacheName: 'supabase-storage',
                expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 14 }, // 14d
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // API calls to Supabase REST/GraphQL: prefer network, fallback to cache
            {
              urlPattern: new RegExp(`^${ENV.SUPABASE_URL.replace(/\./g, '\\.').replace(/\//g, '\\/')}\\/.*`),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api',
                networkTimeoutSeconds: 6,
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 10 }, // 10m
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Google Fonts (optional but common)
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1y
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        includeAssets: [
          'favicon.svg',
          'favicon.ico',
          'robots.txt',
          'apple-touch-icon.png',
        ],
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
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: '/screenshots/home-1080x1920.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Home feed',
            },
            {
              src: '/screenshots/map-1920x1080.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
              label: 'VGrid map',
            },
          ],
          shortcuts: [
            { name: 'Open Feed', short_name: 'Feed', url: '/feed' },
            { name: 'VGrid', short_name: 'VGrid', url: '/grid' },
            { name: 'Messages', short_name: 'DMs', url: '/messages' },
          ],
          handle_links: 'preferred', // deep-link handling on some platforms
        },
        // Enable dev service worker for local PWA testing only when explicitly set
        devOptions: {
          enabled: process.env.VITE_PWA_DEV === 'true',
          suppressWarnings: true,
          navigateFallback: 'index.html',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': '/src',
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
    },
    build: {
      target: 'es2020',
      sourcemap: mode === 'development' ? true : false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        external: ['@ffmpeg/core'],
        output: {
          // sensible vendor/code-splitting for faster loads + better caching
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
    server: {
      port: 5173,
      strictPort: true,
      // If you ever need SharedArrayBuffer (e.g., for ffmpeg WASM), uncomment:
      // headers: {
      //   'Cross-Origin-Opener-Policy': 'same-origin',
      //   'Cross-Origin-Embedder-Policy': 'require-corp',
      // },
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
    define: {
      // minimal shim for libs that expect process.env
      'process.env': {},
      __APP_ENV__: JSON.stringify(mode),
    },
    esbuild: {
      jsx: 'automatic',
    },
  }
})
