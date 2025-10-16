/* src/sw.js */
/// <reference lib="WebWorker" />
/* eslint-disable no-restricted-globals */

// Work out if we’re on localhost/dev
const SCOPE_URL = new URL(self.registration.scope);
const IS_DEV = /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/.test(SCOPE_URL.origin);

// ── A) Workbox precache only in PROD ─────────────────────────
let didPrecache = false;
if (!IS_DEV) {
  (async () => {
    try {
      const { precacheAndRoute } = await import('workbox-precaching');
      precacheAndRoute(self.__WB_MANIFEST);
      didPrecache = true;
    } catch (e) {
      console.warn('[SW] workbox precache skipped:', e);
    }
  })();
}

// ── B) Dev-only: fix Vite module worker MIME for Firefox ─────
if (IS_DEV) {
  self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    const isSameOrigin = url.origin === SCOPE_URL.origin;

    if (
      isSameOrigin &&
      url.pathname.endsWith('/worker.js') &&
      url.searchParams.has('worker_file') &&
      url.searchParams.get('type') === 'module'
    ) {
      event.respondWith((async () => {
        const r = await fetch(request);
        const ct = r.headers.get('content-type') || '';
        if (ct.includes('javascript')) return r;

        const body = await r.blob();
        const headers = new Headers(r.headers);
        headers.set('content-type', 'text/javascript; charset=utf-8');

        return new Response(body, {
          status: r.status,
          statusText: r.statusText,
          headers,
        });
      })());
    }
  });
}

// ── C) Install/activate ─────────────────────────────────────
self.addEventListener('install', (e) => {
  self.skipWaiting();
  console.log('[SW] installed', { didPrecache, IS_DEV });
});
self.addEventListener('activate', (e) => {
  self.clients.claim();
  console.log('[SW] activated', { didPrecache, IS_DEV });
});

// Keep the rest of your Background Upload Queue + Notifications logic unchanged...
// (everything from D) BACKGROUND UPLOAD QUEUE onwards stays the same)
