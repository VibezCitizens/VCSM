import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  normalizeLocale,
  stripLocaleFromPathname
} from "@/lib/i18n";
import { buildCanonical } from "@/seo/canonical";

export function normalizeLocalePath(path) {
  const rawPath = String(path ?? "/").split(/[?#]/)[0] || "/";
  const cleanPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const strippedPath = stripLocaleFromPathname(cleanPath).replace(/\/{2,}/g, "/");
  if (strippedPath !== "/" && strippedPath.endsWith("/")) {
    return strippedPath.slice(0, -1);
  }
  return strippedPath || "/";
}

export function getLocaleFromPath(path) {
  const firstSegment = String(path ?? "")
    .split(/[?#]/)[0]
    .split("/")
    .filter(Boolean)[0];
  return isSupportedLocale(firstSegment) ? firstSegment : null;
}

export function withLocalePath(locale, path) {
  const cleanPath = normalizeLocalePath(path);
  const normalizedLocale = normalizeLocale(locale);
  if (cleanPath === "/") return `/${normalizedLocale}`;
  return `/${normalizedLocale}${cleanPath}`;
}

// SEO consolidation (TICKET-TRAZE-SEO-REMEDIATION-001): the /en and /es route
// trees render byte-identical English SSR HTML — the Spanish dictionary applies
// only after client hydration (see lib/language.js), so crawlers receive English
// for every locale variant. Emitting per-locale self-canonicals plus an
// en/es/x-default hreflang cluster therefore produced duplicate English URLs and
// advertised Spanish content that is never server-rendered. Until Spanish is
// server-rendered, every locale variant consolidates to the single unprefixed
// English canonical and no hreflang cluster is emitted. The `options` argument
// (formerly { locale }) is intentionally ignored and retained only so existing
// call sites keep type-compatibility.
export function buildLocalizedAlternates(path) {
  const basePath = normalizeLocalePath(path);

  return {
    basePath,
    canonicalPath: basePath,
    canonical: buildCanonical(basePath),
    languages: undefined
  };
}

export function listLocalizedSitemapPaths(path) {
  // Only the unprefixed English URL is canonical/indexable (see
  // buildLocalizedAlternates); the /en and /es variants consolidate to it, so the
  // sitemap lists the base path only — no duplicate locale URLs.
  return [{ locale: null, path: normalizeLocalePath(path) }];
}

export function routeLocaleToOpenGraphLocale(routeLocale, fallback = "en_US") {
  if (routeLocale === "es") return "es_ES";
  if (routeLocale === DEFAULT_LOCALE) return "en_US";
  return fallback;
}
