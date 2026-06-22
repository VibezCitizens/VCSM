// [VPORT_ONLY] — vport tab layout definitions
// src/features/profiles/kinds/vport/config/profileTabs.config.js

const T = (key, label) => ({ key, label, tKey: `vport.tabs.${key}` });

export const TAB = Object.freeze({
  VIBES: T("vibes", "Vibes"),
  PHOTOS: T("photos", "Photos"),
  ABOUT: T("about", "About"),
  SUBSCRIBERS: T("subscribers", "Subscribers"),
  REVIEWS: T("reviews", "Reviews"),
  MENU: T("menu", "Menu"),

  GAS: T("gas", "Gas"),

  SERVICES: T("services", "Services"),
  RATES: T("rates", "Rates"),

  PORTFOLIO: T("portfolio", "Portfolio"),
  BOOK: T("book", "Book"),

  // ✅ NEW
  CONTENT: T("content", "Content"),
  TEAM: T("team", "Team"),
});

export const TAB_FLAGS = Object.freeze({
  // ✅ ENABLE TODAY
  SERVICES: true,
  RATES: true,

  PORTFOLIO: true,
  BOOK: true,
});

function makeTabs(keys) {
  return Object.freeze(
    keys
      .map((k) => {
        if (TAB_FLAGS[k] === false) return null;
        const tab = TAB[k];
        if (!tab) {
          console.warn(`[profileTabs] Unknown TAB key: ${k}`);
          return null;
        }
        return tab;
      })
      .filter(Boolean)
  );
}

// ─── Base layouts ──────────────────────────────────────────────────────────

export const VPORT_TABS = makeTabs([
  "ABOUT",
  "REVIEWS",
  "CONTENT",
  "VIBES",
  "PHOTOS",
  "SUBSCRIBERS",
]);

export const VPORT_SERVICE_TABS = makeTabs([
  "PORTFOLIO",
  "SERVICES",
  "REVIEWS",
  "CONTENT",
  "ABOUT",
  "VIBES",
  "PHOTOS",
  "SUBSCRIBERS",
]);

export const VPORT_BARBER_TABS = makeTabs([
  "PORTFOLIO",
  "BOOK",
  "SERVICES",
  "REVIEWS",
  "CONTENT",
  "ABOUT",
  "PHOTOS",
  "VIBES",
  "SUBSCRIBERS",
]);

export const VPORT_BARBERSHOP_TABS = makeTabs([
  "PORTFOLIO",
  "BOOK",
  "TEAM",
  "SERVICES",
  "REVIEWS",
  "ABOUT",
  "PHOTOS",
  "VIBES",
  "CONTENT",
  "SUBSCRIBERS",
]);

export const VPORT_FOOD_TABS = makeTabs([
  "MENU",
  "REVIEWS",
  "CONTENT",
  "ABOUT",
  "SERVICES",
  "PHOTOS",
  "VIBES",
  "SUBSCRIBERS",
]);

export const VPORT_GAS_TABS = makeTabs([
  "GAS",
  "SERVICES",
  "CONTENT",
  "ABOUT",
  "REVIEWS",
  "PHOTOS",
  "VIBES",
  "SUBSCRIBERS",
]);

export const VPORT_RATES_TABS = makeTabs([
  "RATES",
  "SERVICES",
  "CONTENT",
  "REVIEWS",
  "ABOUT",
  "PHOTOS",
  "VIBES",
  "SUBSCRIBERS",
]);

// ─── New layouts ───────────────────────────────────────────────────────────

// Arts, Media & Entertainment — portfolio-first for visual/performing creators.
export const VPORT_CREATIVE_TABS = makeTabs([
  "PORTFOLIO",
  "VIBES",
  "CONTENT",
  "REVIEWS",
  "SERVICES",
  "ABOUT",
  "PHOTOS",
  "SUBSCRIBERS",
]);

// Beauty & Wellness (broad), Education & Care, Sports & Fitness, Animal Care
// — service + portfolio + booking in one layout.
export const VPORT_SERVICE_BOOK_TABS = makeTabs([
  "PORTFOLIO",
  "BOOK",
  "SERVICES",
  "REVIEWS",
  "ABOUT",
  "PHOTOS",
  "VIBES",
  "SUBSCRIBERS",
]);

// Health & Medical — appointment-first, no portfolio.
export const VPORT_HEALTH_TABS = makeTabs([
  "BOOK",
  "SERVICES",
  "REVIEWS",
  "ABOUT",
  "PHOTOS",
  "SUBSCRIBERS",
]);

// Home, Maintenance & Trades — portfolio of past work is the primary trust signal.
export const VPORT_TRADES_TABS = makeTabs([
  "PORTFOLIO",
  "SERVICES",
  "BOOK",
  "REVIEWS",
  "ABOUT",
  "PHOTOS",
  "SUBSCRIBERS",
]);

// Retail, Sales & Commerce — services/products catalog first.
export const VPORT_RETAIL_TABS = makeTabs([
  "SERVICES",
  "REVIEWS",
  "ABOUT",
  "PHOTOS",
  "VIBES",
  "SUBSCRIBERS",
]);
