// src/features/profiles/config/profileTabs.config.js

const T = (key, label) => ({ key, label });

export const TAB = Object.freeze({
  VIBES: T("vibes", "Vibes"),
  PHOTOS: T("photos", "Photos"),
  ABOUT: T("about", "About"),
  SUBSCRIBERS: T("subscribers", "Subscribers"),
  REVIEWS: T("reviews", "Reviews"),
  MENU: T("menu", "Menu"),
  SERVICES: T("services", "Services"),
  PORTFOLIO: T("portfolio", "Portfolio"),
  BOOK: T("book", "Book"),
});

function makeTabs(keys) {
  return Object.freeze(
    keys
      .map((k) => {
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

/* ============================================================
   BASE LAYOUTS
   ============================================================ */

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
  "PORTFOLIO",
  "BOOK",
  "REVIEWS",
  "VIBES",
  "SUBSCRIBERS",
  "PHOTOS",
]);

export const VPORT_FOOD_TABS = makeTabs([
  "MENU",
  "REVIEWS",
  "ABOUT",
  "PHOTOS",
  "VIBES",
  "SUBSCRIBERS",
]);
