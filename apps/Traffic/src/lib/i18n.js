export const SUPPORTED_LOCALES = ["en", "es"];
export const DEFAULT_LOCALE = "en";
export const LOCALE_STORAGE_KEY = "traffic-lang";

export function normalizeLocale(locale) {
  return locale === "es" ? "es" : DEFAULT_LOCALE;
}

export function isSupportedLocale(locale) {
  return SUPPORTED_LOCALES.includes(locale);
}

export function localeFromPathname(pathname) {
  const firstSegment = String(pathname ?? "")
    .split("/")
    .filter(Boolean)[0];
  return isSupportedLocale(firstSegment) ? firstSegment : null;
}

export function stripLocaleFromPathname(pathname) {
  const path = String(pathname ?? "/") || "/";
  const parts = path.split("/");
  const firstSegment = parts[1];

  if (!isSupportedLocale(firstSegment)) {
    return path || "/";
  }

  const stripped = `/${parts.slice(2).join("/")}`.replace(/\/+$/, "");
  return stripped === "" ? "/" : stripped;
}

export function withLocale(pathname, locale) {
  const normalizedLocale = normalizeLocale(locale);
  const cleanPath = stripLocaleFromPathname(pathname);
  if (cleanPath === "/") return `/${normalizedLocale}`;
  return `/${normalizedLocale}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
}

export function switchLocalePath(pathname, locale) {
  return withLocale(pathname, locale);
}
