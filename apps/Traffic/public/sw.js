const CACHE_VERSION = "traze-v3";
const CACHE_ASSETS = `${CACHE_VERSION}-assets`;
const CACHE_PAGES = `${CACHE_VERSION}-pages`;
const CORE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/favicon.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/geo/world-countries.topo.json"
];

const ALL_CACHES = new Set([CACHE_ASSETS, CACHE_PAGES]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_ASSETS).then((cache) =>
      cache.addAll(CORE_ASSETS).catch(() => undefined)
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("traze-") && !ALL_CACHES.has(key))
          .map((key) => caches.delete(key))
      );
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Versioned Next.js static assets — stale while revalidate
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(staleWhileRevalidate(request, CACHE_ASSETS));
    return;
  }

  if (isCoreAsset(url.pathname) || request.destination === "image" || request.destination === "manifest") {
    event.respondWith(staleWhileRevalidate(request, CACHE_ASSETS));
    return;
  }

  // HTML pages — network first, fall back to cache
  if (request.destination === "document" || request.mode === "navigate") {
    event.respondWith(networkFirst(request, CACHE_PAGES));
    return;
  }
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached ?? (await networkFetch) ?? Response.error();
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(cacheName);
    return (await cache.match(request)) ?? (await caches.match("/offline.html")) ?? Response.error();
  }
}

function isCoreAsset(pathname) {
  return CORE_ASSETS.includes(pathname) || pathname.startsWith("/icons/");
}
