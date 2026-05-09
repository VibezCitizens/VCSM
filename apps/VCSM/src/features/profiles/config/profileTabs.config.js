// src/features/profiles/config/profileTabs.config.js

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


/**
 * TAB catalog
 * -----------
 * The canonical list of supported tabs.
 *
 * Notes:
 * - The object keys (e.g., "SERVICES") are the identifiers used in layout arrays.
 * - The "key" field (e.g., "services") is what UI/state/routing typically uses.
 * - Keeping WIP tabs here is safe; visibility is controlled by TAB_FLAGS + layouts.
 */

/**
 * TAB_FLAGS (Feature Flags)
 * -------------------------
 * Toggle tabs on/off without removing them from TAB or layouts.
 *
 * Rules:
 * - false  => hidden everywhere (even if a layout includes it)
 * - true   => explicitly enabled (optional; enabled by default if undefined)
 * - undefined => treated as enabled (default)
 *
 * Use case:
 * - Shut down tabs until implementation is ready, then reactivate by flipping to true.
 */

/**
 * makeTabs(keys)
 * --------------
 * Builds an immutable array of tab objects from an array of TAB keys.
 *
 * Steps:
 *  1) For each key, skip if TAB_FLAGS[key] === false
 *  2) Validate that TAB[key] exists; warn if unknown
 *  3) Return a frozen array of tab objects
 *
 * Profile Tabs Configuration
 * ==========================
 *
 * This module defines:
 *  1) TAB catalog: all possible tabs (key + label).
 *  2) TAB_FLAGS: feature flags to "shutdown" (hide) specific tabs without deleting them.
 *  3) makeTabs(): builds immutable tab arrays from string keys, applying flags + validation.
 *  4) Layout exports: predefined tab layouts for different VPORT contexts.
 *
 * How to use
 * ----------
 * - Remove a tab: remove its string from the layout array (or set TAB_FLAGS[KEY] = false).
 * - Reorder tabs: reorder the strings in the layout array.
 * - Add a tab:
 *     1) add it to TAB
 *     2) optionally add flag to TAB_FLAGS
 *     3) add its KEY to one or more layout arrays
 *
 * Important behaviors
 * -------------------
 * - If TAB_FLAGS[KEY] === false, that tab will NOT appear even if present in a layout array.
 * - Unknown keys in layout arrays will warn and be skipped.
 * - All returned arrays are frozen for safety (immutable).
 */

/* ============================================================
   OPTIONAL NOTES / PENDING (FYI)
   ============================================================
 *
 * This file controls tab VISIBILITY in tab lists by layout + flags.
 * If your app supports deep links/routes to tab screens, you may also want:
 * - a route guard that blocks navigation to disabled tabs
 * - a default-tab resolver that never selects a disabled tab
 *
 * Those guards usually live where tabs are rendered / active tab is selected.
 */
