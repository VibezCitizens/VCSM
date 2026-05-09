import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
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

export function buildLocalizedAlternates(path, options = {}) {
  const basePath = normalizeLocalePath(path);
  const locale = options.locale && isSupportedLocale(options.locale)
    ? options.locale
    : getLocaleFromPath(path);
  const canonicalPath = locale ? withLocalePath(locale, basePath) : basePath;

  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((entryLocale) => [
      entryLocale,
      buildCanonical(withLocalePath(entryLocale, basePath))
    ])
  );

  languages["x-default"] = buildCanonical(basePath);

  return {
    basePath,
    canonicalPath,
    canonical: buildCanonical(canonicalPath),
    languages
  };
}

export function listLocalizedSitemapPaths(path) {
  const basePath = normalizeLocalePath(path);
  return [
    { locale: null, path: basePath },
    ...SUPPORTED_LOCALES.map((locale) => ({ locale, path: withLocalePath(locale, basePath) }))
  ];
}

export function routeLocaleToOpenGraphLocale(routeLocale, fallback = "en_US") {
  if (routeLocale === "es") return "es_ES";
  if (routeLocale === DEFAULT_LOCALE) return "en_US";
  return fallback;
}
