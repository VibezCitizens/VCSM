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

function cleanString(value, maxLength = 160) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function cleanNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function compactPayload(payload = {}) {
  const output = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value == null || value === "") continue;
    if (typeof value === "string") {
      const cleaned = cleanString(value);
      if (cleaned) output[key] = cleaned;
      continue;
    }
    if (typeof value === "number") {
      const cleaned = cleanNumber(value);
      if (cleaned != null) output[key] = cleaned;
      continue;
    }
    if (typeof value === "boolean") {
      output[key] = value;
    }
  }

  return output;
}

export function trackEvent(event, payload = {}) {
  if (typeof window === "undefined") return;
  const eventName = cleanString(event, 64);
  if (!eventName) return;

  const safePayload = compactPayload({
    path: window.location?.pathname ?? null,
    ...payload
  });

  if (GA_ID) gtag("event", eventName, safePayload);
  beacon({ event: eventName, ...safePayload });
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
  trackEvent("page_view", { page_path: path, path });
}

/**
 * Fires a search event.
 * @param {{ query?: string, citySlug?: string, serviceSlug?: string }} params
 */
export function trackSearch({ query = "", citySlug = null, serviceSlug = null } = {}) {
  if (typeof window === "undefined") return;
  trackEvent("search", {
    search_term: query || serviceSlug || citySlug || "",
    query,
    citySlug,
    serviceSlug
  });
}

export function trackProviderCardClick({
  providerSlug = null,
  surface = "directory",
  rank = null,
  countrySlug = null,
  citySlug = null,
  serviceSlug = null
} = {}) {
  trackEvent("provider_card_click", {
    providerSlug,
    surface,
    rank,
    countrySlug,
    citySlug,
    serviceSlug
  });
}

export function trackProviderAction({
  action,
  providerSlug = null,
  surface = "provider",
  providerSource = null
} = {}) {
  trackEvent("provider_action", {
    action,
    providerSlug,
    surface,
    providerSource
  });
}

export function trackProviderLeadSubmitted({
  providerSlug = null,
  surface = "provider",
  hasEmail = false,
  hasPhone = false
} = {}) {
  trackEvent("provider_lead_submitted", {
    providerSlug,
    surface,
    hasEmail,
    hasPhone
  });
}

export function trackAnswerSearch({ query = "" } = {}) {
  trackEvent("answer_search", {
    query,
    search_term: query
  });
}

export function trackAnswerRead({ answerSlug = null, topicSlug = null } = {}) {
  trackEvent("answer_read", {
    answerSlug,
    topicSlug
  });
}

export function trackQuestionSubmitted({ hasBody = false } = {}) {
  trackEvent("question_submitted", {
    hasBody
  });
}
