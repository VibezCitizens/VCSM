import { getPlatformOrigin } from "@/lib/env";

// TICKET-TRAZE-CLAIM-LANDING-002 — locale-aware claim landing links.
//
// The VCSM claim/create landing is published under two locale-specific slugs
// (see TICKET-TRAZE-CLAIM-LANDING-001): /claim-business (EN) and
// /reclamar-negocio (ES). These are distinct platform paths — NOT the /es
// route-prefix scheme used by withLocale() for TRAZE's own pages — so global
// claim CTAs must pick the slug from the current TRAZE language.
//
// Callers supply the language resolved by the existing locale infrastructure
// (useTrafficLanguage().lang). This module owns only the slug mapping + URL
// assembly; it does NOT detect locale.

/**
 * Map the current TRAZE language to the VCSM claim landing path.
 * @param {"en"|"es"|string} lang
 * @returns {string}
 */
export function claimLandingPath(lang) {
  return lang === "es" ? "/reclamar-negocio" : "/claim-business";
}

/**
 * Build a full platform claim-landing URL for the global (referenceless) claim
 * CTAs. `source=traffic` is always attributed; `surface` is optional.
 * @param {"en"|"es"|string} lang
 * @param {{ surface?: string|null }} [options]
 * @returns {string}
 */
export function buildClaimLandingLink(lang, { surface = null } = {}) {
  try {
    const url = new URL(claimLandingPath(lang), getPlatformOrigin());
    url.searchParams.set("source", "traffic");
    if (surface) url.searchParams.set("surface", surface);
    return url.toString();
  } catch {
    return claimLandingPath(lang);
  }
}
