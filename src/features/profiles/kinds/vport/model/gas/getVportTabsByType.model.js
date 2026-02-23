// src/features/profiles/kinds/vport/model/gas/getVportTabsByType.model.js

import {
  VPORT_TABS,
  VPORT_SERVICE_TABS,
  VPORT_FOOD_TABS,
  VPORT_GAS_TABS,
  VPORT_RATES_TABS, // ✅ ADD
} from "@/features/profiles/config/profileTabs.config";

import { VPORT_TYPE_GROUPS } from "@/features/profiles/kinds/vport/config/vportTypes.config";

function normalizeType(v) {
  if (!v) return "other";
  return String(v).trim().toLowerCase();
}

function resolveGroup(type) {
  const t = normalizeType(type);

  for (const [group, types] of Object.entries(VPORT_TYPE_GROUPS)) {
    if (Array.isArray(types) && types.includes(t)) {
      return group;
    }
  }

  return "Other";
}

const GROUP_TABS = Object.freeze({
  "Beauty & Wellness": VPORT_SERVICE_TABS,
  "Food, Hospitality & Events": VPORT_FOOD_TABS,
  Other: VPORT_TABS,
});

const TYPE_TABS = Object.freeze({
  "gas station": VPORT_GAS_TABS,

  // ✅ Money Exchange: rates-first layout
  "exchange": VPORT_RATES_TABS,
});

export function getVportTabsByType(type) {
  const t = normalizeType(type);

  // Type-specific override
  if (TYPE_TABS[t]) {
    const list = TYPE_TABS[t];

    // Gas station → ensure "gas" tab is first
    if (t === "gas station") {
      const ordered = [
        ...list.filter((x) => x.key === "gas"),
        ...list.filter((x) => x.key !== "gas"),
      ];
      return Object.freeze(ordered);
    }

    return Object.freeze([...list]);
  }

  // Group-based resolution
  const group = resolveGroup(t);
  const resolved = GROUP_TABS[group] ?? GROUP_TABS.Other;

  return Object.freeze([...resolved]);
}