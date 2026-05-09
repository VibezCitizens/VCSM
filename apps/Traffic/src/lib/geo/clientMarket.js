const TIMEZONE_COUNTRY_HINTS = {
  "america/los_angeles": "US",
  "america/denver": "US",
  "america/chicago": "US",
  "america/new_york": "US",
  "america/phoenix": "US",
  "america/anchorage": "US",
  "pacific/honolulu": "US",
  "america/mexico_city": "MX",
  "america/monterrey": "MX",
  "america/merida": "MX",
  "america/tijuana": "MX",
  "america/el_salvador": "SV",
  "america/guatemala": "GT",
  "america/belize": "BZ",
  "america/tegucigalpa": "HN",
  "america/managua": "NI",
  "america/costa_rica": "CR",
  "america/panama": "PA"
};

function normalizeCountryCode(value) {
  const code = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function countryFromLocale(locale) {
  const parts = String(locale ?? "").split("-");
  return normalizeCountryCode(parts.length > 1 ? parts.at(-1) : null);
}

export function getBrowserCountryCode() {
  if (typeof window === "undefined") return null;

  const languageCodes = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language
  ];

  for (const locale of languageCodes) {
    const code = countryFromLocale(locale);
    if (code) return code;
  }

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_COUNTRY_HINTS[String(timezone ?? "").toLowerCase()] ?? null;
  } catch {
    return null;
  }
}

export function findLiveCountryByCode(countryCode, countries = []) {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;
  return countries.find((country) => normalizeCountryCode(country.countryCode) === code) ?? null;
}
