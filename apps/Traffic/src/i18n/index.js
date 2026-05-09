import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n";
import en from "@/i18n/dictionaries/en";
import es from "@/i18n/dictionaries/es";

export const dictionaries = {
  en,
  es
};

function getValue(source, key) {
  return String(key ?? "")
    .split(".")
    .filter(Boolean)
    .reduce((node, part) => (node && Object.prototype.hasOwnProperty.call(node, part) ? node[part] : undefined), source);
}

function interpolate(value, params = {}) {
  if (typeof value !== "string") return value;
  return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const next = params[key];
    return next == null ? "" : String(next);
  });
}

export function translate(key, locale = DEFAULT_LOCALE, params = {}) {
  const lang = normalizeLocale(locale);
  const value = getValue(dictionaries[lang], key) ?? getValue(dictionaries[DEFAULT_LOCALE], key);

  if (value == null) {
    return key;
  }

  return interpolate(value, params);
}

export function getDictionary(locale = DEFAULT_LOCALE) {
  return dictionaries[normalizeLocale(locale)] ?? dictionaries[DEFAULT_LOCALE];
}
