import { getAnyCountryByCode } from "@/data/repositories/geo.repo";

// Regional-indicator flag emoji for any ISO 3166-1 alpha-2 code (e.g. "SV" → 🇸🇻).
// Computed, not hardcoded, so it works for every country code.
function flagEmoji(code) {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  const BASE = 0x1f1e6; // regional indicator 'A'
  return String.fromCodePoint(
    BASE + code.charCodeAt(0) - 65,
    BASE + code.charCodeAt(1) - 65
  );
}

/**
 * Resolve a country code into a human-readable badge: flag + localized name.
 *
 * Flag and name are derived INDEPENDENTLY:
 *   - flag → generated from the ISO code via Unicode regional indicators
 *            (flagEmoji). Any valid 2-letter code shows a flag automatically;
 *            no manual per-country flag map is ever needed.
 *   - name → looked up from the existing taxonomy (getCountryByCode); falls
 *            back to the raw code when the name is unknown.
 *
 * Behavior:
 *   - missing/blank code        → null (caller hides the badge)
 *   - valid code, known name    → { flag, name }              e.g. US → 🇺🇸 United States
 *   - valid code, unknown name  → { flag, name: <RAW CODE> }  flag + code
 *   - present but invalid code  → { flag: "", name: <RAW CODE> }  no flag
 *
 * @param {string|null|undefined} countryCode
 * @param {"en"|"es"} [lang]
 * @returns {{ code: string, flag: string, name: string } | null}
 */
export function getCountryBadge(countryCode, lang = "en") {
  const code = String(countryCode ?? "").trim().toUpperCase();
  if (!code) return null;

  const country = getAnyCountryByCode(code);
  const name = country
    ? (lang === "es" && country.nameEs ? country.nameEs : country.name)
    : code; // unknown name → show the raw code

  // Flag comes from the code itself (regional indicators), not the name lookup,
  // so a valid 2-letter code shows a flag even when its name is unknown.
  return { code, flag: flagEmoji(code), name };
}
