// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'          // keep/remove based on your stack
import UnoCSS from 'unocss/vite'                  // keep/remove if you use UnoCSS
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // <-- alias @ => /src
    },
  },
  plugins: [
    react(),
    UnoCSS(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',

      // Source SW is src/sw.js, output will be dist/sw.js (default).
      // Making the injection point explicit avoids false negatives.
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        injectionPoint: 'self.__WB_MANIFEST',
        globDirectory: 'dist',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // DO NOT set swDest here — plugin emits dist/sw.js automatically.
      },

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
