/* src/sw.js */
/// <reference lib="WebWorker" />
const SCOPE_URL = new URL(self.registration.scope);
const IS_DEV = /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/.test(SCOPE_URL.origin);

const CACHE_PREFIX = "vcsm";
const CACHE_NAMES = Object.freeze({
  static: `${CACHE_PREFIX}-static-v1`,
  images: `${CACHE_PREFIX}-images-v1`,
  fonts: `${CACHE_PREFIX}-fonts-v1`,
  pages: `${CACHE_PREFIX}-pages-v1`,
  data: `${CACHE_PREFIX}-data-v1`,
});

function isSupabasePublicStorage(url) {
  return (
    /\.supabase\.co$/.test(url.hostname) &&
    url.pathname.includes("/storage/v1/object/public/")
  );
}

async function setupProdCaching() {
  const [
    { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL },
    { registerRoute, NavigationRoute },
    { CacheFirst, NetworkFirst, StaleWhileRevalidate },
    { ExpirationPlugin },
    { CacheableResponsePlugin },
  ] = await Promise.all([
    import("workbox-precaching"),
    import("workbox-routing"),
    import("workbox-strategies"),
    import("workbox-expiration"),
    import("workbox-cacheable-response"),
  ]);

  precacheAndRoute(self.__WB_MANIFEST || []);
  cleanupOutdatedCaches();

  const cacheableStatuses = new CacheableResponsePlugin({ statuses: [0, 200] });

  registerRoute(
    new NavigationRoute(createHandlerBoundToURL("/index.html"), {
      denylist: [/^\/api\//, /^\/sw\.js$/, /^\/workbox-[\w-]+\.js$/],
    })
  );

  registerRoute(
    ({ request, url }) =>
      url.origin === self.location.origin &&
      (request.destination === "script" ||
        request.destination === "style" ||
        request.destination === "worker"),
    new CacheFirst({
      cacheName: CACHE_NAMES.static,
      plugins: [
        cacheableStatuses,
        new ExpirationPlugin({
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 30,
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  registerRoute(
    ({ request }) => request.destination === "font",
    new CacheFirst({
      cacheName: CACHE_NAMES.fonts,
      plugins: [
        cacheableStatuses,
        new ExpirationPlugin({
          maxEntries: 80,
          maxAgeSeconds: 60 * 60 * 24 * 365,
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  registerRoute(
    ({ request, url }) =>
      request.destination === "image" &&
      (url.origin === self.location.origin || isSupabasePublicStorage(url)),
    new CacheFirst({
      cacheName: CACHE_NAMES.images,
      plugins: [
        cacheableStatuses,
        new ExpirationPlugin({
          maxEntries: 500,
          maxAgeSeconds: 60 * 60 * 24 * 60,
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  registerRoute(
    ({ request, url }) =>
      request.method === "GET" &&
      request.destination === "" &&
      url.origin === self.location.origin &&
      !url.pathname.startsWith("/api/"),
    new StaleWhileRevalidate({
      cacheName: CACHE_NAMES.data,
      plugins: [
        cacheableStatuses,
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24,
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  registerRoute(
    ({ request, url }) =>
      request.method === "GET" &&
      request.destination === "document" &&
      url.origin === self.location.origin,
    new NetworkFirst({
      cacheName: CACHE_NAMES.pages,
      networkTimeoutSeconds: 3,
      plugins: [
        cacheableStatuses,
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7,
          purgeOnQuotaError: true,
        }),
      ],
    })
  );
}

if (!IS_DEV) {
  setupProdCaching().catch((error) => {
    console.warn("[SW] setupProdCaching failed", error);
  });
}

if (IS_DEV) {
  self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);
    const isSameOrigin = url.origin === SCOPE_URL.origin;

    if (
      isSameOrigin &&
      url.pathname.endsWith("/worker.js") &&
      url.searchParams.has("worker_file") &&
      url.searchParams.get("type") === "module"
    ) {
      event.respondWith(
        (async () => {
          const response = await fetch(request);
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("javascript")) return response;

          const body = await response.blob();
          const headers = new Headers(response.headers);
          headers.set("content-type", "text/javascript; charset=utf-8");

          return new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        })()
      );
    }
  });
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const keys = await caches.keys();
      const active = new Set(Object.values(CACHE_NAMES));
      await Promise.all(
        keys
          .filter((key) => key.startsWith(`${CACHE_PREFIX}-`) && !active.has(key))
          .map((key) => caches.delete(key))
      );
    })()
  );
});
