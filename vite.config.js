// vite.config.js (PWA block only)
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
})
