// src/features/profiles/config/profileTabs.config.js

const T = (key, label) => ({ key, label });

export const TAB = Object.freeze({
  VIBES: T("vibes", "Vibes"),
  PHOTOS: T("photos", "Photos"),
  ABOUT: T("about", "About"),
  SUBSCRIBERS: T("subscribers", "Subscribers"),
  REVIEWS: T("reviews", "Reviews"),
  MENU: T("menu", "Menu"),

  GAS: T("gas", "Gas"),

  // ✅ NEW
  SERVICES: T("services", "Services"),
  RATES: T("rates", "Rates"),

  PORTFOLIO: T("portfolio", "Portfolio"),
  BOOK: T("book", "Book"),
});

export const TAB_FLAGS = Object.freeze({
  // ✅ ENABLE TODAY
  SERVICES: true,
  RATES: true,

  PORTFOLIO: false,
  BOOK: false,
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

export const VPORT_TABS = makeTabs([
  "VIBES",
  "PHOTOS",
  "ABOUT",
  "SUBSCRIBERS",
  "REVIEWS",
]);

export const VPORT_SERVICE_TABS = makeTabs([
  "ABOUT",
  "SERVICES",
  "REVIEWS",
  "VIBES",
  "SUBSCRIBERS",
  "PHOTOS",
]);

export const VPORT_FOOD_TABS = makeTabs([
  "MENU",
  "REVIEWS",
  "ABOUT",
  "SERVICES", // ✅ food can also show capabilities
  "PHOTOS",
  "VIBES",
  "SUBSCRIBERS",
]);

export const VPORT_GAS_TABS = makeTabs([
  "GAS",
  "SERVICES", // ✅ gas amenities live here
  "ABOUT",
  "REVIEWS",
  "PHOTOS",
  "VIBES",
  "SUBSCRIBERS",
]);

// ✅ NEW: money exchange / rates-driven layout
export const VPORT_RATES_TABS = makeTabs([
  "RATES",
  "SERVICES",
  "REVIEWS",
  "ABOUT",
  "PHOTOS",
  "VIBES",
  "SUBSCRIBERS",
]);

/**
 * Profile Tabs Configuration
 * ==========================
 *
 * This module defines:
 *  1) TAB catalog: all possible tabs (key + label).
 *  2) TAB_FLAGS: feature flags to "shutdown" (hide) specific tabs without deleting them.
 *  3) makeTabs(): builds immutable tab arrays from string keys, applying flags + validation.
 *  4) Layout exports: predefined tab layouts for different VPORT contexts.
 *
 * Why this exists
 * --------------
 * - Keep tab definitions centralized.
 * - Control what shows per layout by editing arrays only.
 * - Allow WIP tabs to be disabled via flags and re-enabled later with one flip.
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

/**


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

/* ============================================================
   BASE LAYOUTS
   ============================================================
 *
 * Layouts define:
 * - which tabs show for a given profile context
 * - the order they show
 *
 * You can add new layouts later without touching UI, as long as UI reads from these exports.
 */

/**
 * VPORT_TABS
 * ----------
 * Default/general VPORT layout (fallback for "Other" group).
 */

/**
 * VPORT_SERVICE_TABS
 * ------------------
 * Layout intended for service-oriented VPORTs (e.g., Beauty & Wellness).
 *
 * Notes:
 * - Includes SERVICES/PORTFOLIO/BOOK keys, but they are currently disabled via TAB_FLAGS.
 * - When ready, flip TAB_FLAGS.SERVICES/PORTFOLIO/BOOK to true to show them.
 */
/**
 * VPORT_FOOD_TABS
 * --------------
 * Layout intended for food/hospitality VPORTs (e.g., restaurants, catering).
 */

/**
 * VPORT_GAS_TABS
 * --------------
 * Layout intended for gas/fuel VPORTs.
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