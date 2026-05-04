/**
 * Lightweight analytics module.
 *
 * Supports two optional backends, configured via env vars:
 *   NEXT_PUBLIC_GA_ID              — Google Analytics 4 measurement ID (e.g. G-XXXXXXXXXX)
 *   NEXT_PUBLIC_ANALYTICS_ENDPOINT — Custom JSON beacon endpoint URL
 *
 * If neither is set, all functions are no-ops. Safe to call in SSR context
 * (guarded by typeof window checks). Must only be called from client components.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? null;
const CUSTOM_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT ?? null;

function gtag(...args) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(args);
}

function beacon(payload) {
  if (!CUSTOM_ENDPOINT || typeof navigator === "undefined") return;
  try {
    navigator.sendBeacon(CUSTOM_ENDPOINT, JSON.stringify({ ...payload, ts: Date.now() }));
  } catch {
    // sendBeacon not available — ignore
  }
}

/**
 * Injects the GA4 script and initializes dataLayer.
 * Safe to call multiple times — idempotent.
 */
export function initAnalytics() {
  if (typeof window === "undefined" || !GA_ID) return;
  if (document.querySelector(`script[data-ga-id="${GA_ID}"]`)) return;

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  script.dataset.gaId = GA_ID;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", GA_ID, { send_page_view: false });
}

/**
 * Fires a page_view event.
 * @param {string} path — e.g. "/us/miami"
 */
export function trackPageView(path) {
  if (typeof window === "undefined") return;
  if (GA_ID) gtag("event", "page_view", { page_path: path });
  beacon({ event: "page_view", path });
}

/**
 * Fires a search event.
 * @param {{ query?: string, citySlug?: string, serviceSlug?: string }} params
 */
export function trackSearch({ query = "", citySlug = null, serviceSlug = null } = {}) {
  if (typeof window === "undefined") return;
  if (GA_ID) {
    gtag("event", "search", {
      search_term: query || serviceSlug || citySlug || "",
      city_slug: citySlug,
      service_slug: serviceSlug
    });
  }
  beacon({ event: "search", query, citySlug, serviceSlug });
}
