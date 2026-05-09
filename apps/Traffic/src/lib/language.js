"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  localeFromPathname,
  normalizeLocale
} from "@/lib/i18n";
import { translate } from "@/i18n";

// ─── Context ──────────────────────────────────────────────────────────────────

// Context value shape: { lang: "en" | "es", setLang: (lang: string) => void }
export const LanguageContext = createContext("en");

// ─── Detection ────────────────────────────────────────────────────────────────

function detectInitialLang() {
  // SSR guard — no window/localStorage access during server render
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const routeLocale = localeFromPathname(window.location.pathname);
  if (routeLocale) return routeLocale;

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch {
    // localStorage blocked (private mode, etc.) — fall through
  }

  try {
    if (navigator.language?.startsWith("es")) return "es";
  } catch {
    // navigator not available — fall through
  }

  return DEFAULT_LOCALE;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }) {
  // Start with "en" on the server; client reconciles on mount
  const [lang, setLangState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    setLangState(detectInitialLang());
  }, []);

  function setLang(next) {
    const value = normalizeLocale(next);
    setLangState(value);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, value);
    } catch {
      // localStorage blocked — still update in-memory state
    }
  }

  function t(key, params) {
    return translate(key, lang, params);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTrafficLanguage() {
  const ctx = useContext(LanguageContext);
  // If consumed above the provider (shouldn't happen), return a no-op fallback
  if (typeof ctx === "string") return { lang: ctx, setLang: () => {}, t: (key, params) => translate(key, ctx, params) };
  return ctx;
}

// ─── Pure helper ──────────────────────────────────────────────────────────────

/**
 * Returns the localized label for an entity that has `name` and optionally `nameEs`.
 * Works outside React — safe to call in data transforms, server code, etc.
 *
 * @param {{ name?: string, nameEs?: string } | null | undefined} entity
 * @param {"en" | "es"} lang
 * @returns {string}
 */
export function getLocalizedLabel(entity, lang) {
  if (lang === "es" && entity?.nameEs) return entity.nameEs;
  return entity?.name ?? "";
}
