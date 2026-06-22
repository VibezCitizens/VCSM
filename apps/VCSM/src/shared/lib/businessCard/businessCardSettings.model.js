export const DEFAULT_BUSINESS_CARD_SETTINGS = {
  identity: {
    show_avatar: true,
    show_business_name: true,
    show_handle: true,
    show_category_badge: true,
    show_description: true,
    show_reviews: true,
  },
  contact: {
    show_contact_section: true,
    show_phone: true,
    show_address: true,
    show_email: false,
  },
  actions: {
    show_call_btn: true,
    show_text_btn: true,
    show_profile_btn: true,
    show_request_btn: true,
  },
  sections: {
    show_services: false,
    show_portfolio: false,
    show_menu: false,
    show_hours: false,
    show_fuel_prices: false,
    show_amenities: false,
    show_rates: false,
    show_reviews_section: false,
  },
};

// Per-type section defaults — only override sections that differ from global defaults
const TYPE_SECTION_OVERRIDES = {
  "barber":       { show_services: true, show_portfolio: true, show_hours: true },
  "barbershop":   { show_services: true, show_portfolio: true, show_hours: true },
  "restaurant":   { show_menu: true,     show_hours: true },
  "gas station":  { show_fuel_prices: true, show_hours: true, show_amenities: true },
  "exchange":     { show_rates: true,    show_hours: true },
};

/**
 * Deep merge two structured settings objects (one level of nesting).
 * Keys in override that are objects get shallow-merged with the matching base key.
 * Keys that exist only in override are included (enables sparse raw storage).
 */
export function deepMergeSettings(base, override) {
  if (!override || typeof override !== "object") return base ?? {};
  const baseObj = base && typeof base === "object" ? base : {};
  const allKeys = new Set([...Object.keys(baseObj), ...Object.keys(override)]);
  const result = { ...baseObj };
  for (const key of allKeys) {
    const oVal = override[key];
    if (oVal === undefined) continue;
    const bVal = baseObj[key];
    if (
      bVal !== null && bVal !== undefined &&
      typeof bVal === "object" &&
      oVal !== null && typeof oVal === "object"
    ) {
      result[key] = { ...bVal, ...oVal };
    } else {
      result[key] = oVal;
    }
  }
  return result;
}

/**
 * Returns effective settings for a public card.
 * Layer order: global defaults → type-specific section defaults → saved owner overrides.
 */
export function getBusinessCardSettings(vportType, savedSettings) {
  const typeKey = String(vportType || "other").toLowerCase().replace(/_/g, " ");
  const sectionOverride = TYPE_SECTION_OVERRIDES[typeKey] ?? {};
  const withTypeSections = deepMergeSettings(DEFAULT_BUSINESS_CARD_SETTINGS, {
    sections: sectionOverride,
  });
  return deepMergeSettings(
    withTypeSections,
    savedSettings && typeof savedSettings === "object" ? savedSettings : {}
  );
}

// Section toggles shown in the settings UI per type
const SECTION_TOGGLES_BY_TYPE = {
  "barber": [
    { key: "show_services",        label: "Show services" },
    { key: "show_portfolio",       label: "Show portfolio" },
    { key: "show_hours",           label: "Show hours" },
    { key: "show_reviews_section", label: "Show reviews section" },
  ],
  "barbershop": [
    { key: "show_services",        label: "Show services" },
    { key: "show_portfolio",       label: "Show portfolio" },
    { key: "show_hours",           label: "Show hours" },
    { key: "show_reviews_section", label: "Show reviews section" },
  ],
  "restaurant": [
    { key: "show_menu",            label: "Show menu" },
    { key: "show_hours",           label: "Show hours" },
    { key: "show_reviews_section", label: "Show reviews section" },
  ],
  "gas station": [
    { key: "show_fuel_prices",     label: "Show fuel prices" },
    { key: "show_hours",           label: "Show hours" },
    { key: "show_amenities",       label: "Show amenities" },
    { key: "show_reviews_section", label: "Show reviews section" },
  ],
  "exchange": [
    { key: "show_rates",           label: "Show exchange rates" },
    { key: "show_hours",           label: "Show hours" },
    { key: "show_reviews_section", label: "Show reviews section" },
  ],
  "default": [
    { key: "show_hours",           label: "Show hours" },
    { key: "show_reviews_section", label: "Show reviews section" },
  ],
};

export function getSectionToggles(vportType) {
  const key = String(vportType || "other").toLowerCase().replace(/_/g, " ");
  return SECTION_TOGGLES_BY_TYPE[key] ?? SECTION_TOGGLES_BY_TYPE["default"];
}
