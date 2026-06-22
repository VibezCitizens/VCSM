// src/features/profiles/kinds/vport/model/getVportTabsByType.model.js
//
// Resolves the correct tab layout for a given VPort type.
// Priority: TYPE_TABS (exact match) → GROUP_TABS (group default) → VPORT_TABS (global fallback).

import {
  VPORT_TABS,
  VPORT_BARBER_TABS,
  VPORT_BARBERSHOP_TABS,
  VPORT_SERVICE_TABS,
  VPORT_FOOD_TABS,
  VPORT_GAS_TABS,
  VPORT_RATES_TABS,
  VPORT_CREATIVE_TABS,
  VPORT_SERVICE_BOOK_TABS,
  VPORT_HEALTH_TABS,
  VPORT_TRADES_TABS,
  VPORT_RETAIL_TABS,
} from "@/features/profiles/kinds/vport/config/profileTabs.config";

import { VPORT_TYPE_GROUPS } from "@/features/profiles/kinds/vport/config/vportTypes.config";

function normalizeType(v) {
  if (!v) return "other";
  return String(v).trim().toLowerCase().replace(/_/g, " ");
}

function resolveGroup(type) {
  const t = normalizeType(type);
  for (const [group, types] of Object.entries(VPORT_TYPE_GROUPS)) {
    if (Array.isArray(types) && types.includes(t)) return group;
  }
  return "Other";
}

// Type-level overrides — most specific, takes priority over group defaults.
const TYPE_TABS = Object.freeze({
  barber: VPORT_BARBER_TABS,
  barbershop: VPORT_BARBERSHOP_TABS,
  locksmith: VPORT_BARBER_TABS,
  "gas station": VPORT_GAS_TABS,
  exchange: VPORT_RATES_TABS,
});

// Group-level defaults — applied when no type override matches.
const GROUP_TABS = Object.freeze({
  "Arts, Media & Entertainment": VPORT_CREATIVE_TABS,
  "Beauty & Wellness": VPORT_SERVICE_BOOK_TABS,
  "Education & Care": VPORT_SERVICE_BOOK_TABS,
  "Health & Medical": VPORT_HEALTH_TABS,
  "Home, Maintenance & Trades": VPORT_TRADES_TABS,
  "Professional & Business Services": VPORT_SERVICE_TABS,
  "Retail, Sales & Commerce": VPORT_RETAIL_TABS,
  "Sports & Fitness": VPORT_SERVICE_BOOK_TABS,
  "Transport & Logistics": VPORT_SERVICE_TABS,
  "Animal Care": VPORT_SERVICE_BOOK_TABS,
  "Food, Hospitality & Events": VPORT_FOOD_TABS,
  Other: VPORT_TABS,
});

export function getVportTabsByType(type) {
  const t = normalizeType(type);

  if (TYPE_TABS[t]) {
    const list = TYPE_TABS[t];

    if (t === "gas station") {
      return Object.freeze([
        ...list.filter((x) => x.key === "gas"),
        ...list.filter((x) => x.key !== "gas"),
      ]);
    }

    return Object.freeze([...list]);
  }

  const group = resolveGroup(t);
  const resolved = GROUP_TABS[group] ?? GROUP_TABS.Other;
  return Object.freeze([...resolved]);
}
