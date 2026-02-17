// src/features/profiles/kinds/vport/vportTypeTabs.registry.js

import {
  VPORT_TABS,
  VPORT_SERVICE_TABS,
  VPORT_FOOD_TABS,
} from "@/features/profiles/config/profileTabs.config";

import { VPORT_TYPE_GROUPS } from "@/features/profiles/kinds/vport/config/vportTypes.config";

function normalizeType(v) {
  if (!v) return "other";
  return String(v).toLowerCase();
}

function resolveGroup(type) {
  const t = normalizeType(type);

  for (const [group, types] of Object.entries(VPORT_TYPE_GROUPS)) {
    if (types.includes(t)) return group;
  }
  return "Other";
}

/**
 * GROUP DEFAULTS (generalized)
 * You can add more bases later without touching UI.
 */
const GROUP_TABS = Object.freeze({
  "Beauty & Wellness": VPORT_SERVICE_TABS,
  "Food, Hospitality & Events": VPORT_FOOD_TABS,

  // optional: give other groups their own layout
  // "Health & Medical": ...
  // "Home, Maintenance & Trades": ...
  // "Professional & Business Services": ...
  Other: VPORT_TABS,
});

/**
 * TYPE OVERRIDES (only when a specific type truly differs)
 * Example: "restaurant" uses food tabs (already covered by group),
 * but "baker" might want no reviews, etc.
 */
const TYPE_TABS = Object.freeze({
  // restaurant: VPORT_FOOD_TABS,
  // barber: VPORT_SERVICE_TABS,
  // dentist: SOME_CUSTOM_TABS,
});

export function getVportTabsByType(type) {
  const t = normalizeType(type);

  // 1) type override wins
  if (TYPE_TABS[t]) return TYPE_TABS[t];

  // 2) otherwise group default
  const group = resolveGroup(t);
  return GROUP_TABS[group] ?? GROUP_TABS.Other;
}
