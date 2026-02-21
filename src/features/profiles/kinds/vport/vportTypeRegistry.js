// src/features/profiles/kinds/vport/vportTypeTabs.registry.js

/**
 * VPORT Type → Tabs Registry
 * ==========================
 *
 * What this file does
 * -------------------
 * This module centralizes the decision of **which tab layout** a VPORT profile should use
 * based on its `vport_type` (ex: "restaurant", "barber", "gas station").
 *
 * It returns **an array of tab objects** (ex: [{ key: "menu", label: "Menu" }, ...])
 * that your UI can render directly.
 *
 * How it works (resolution order)
 * -------------------------------
 * 1) TYPE OVERRIDE (most specific)
 *    - If a specific type has a special layout, it wins.
 *    - Example: "gas station" should always use VPORT_GAS_TABS regardless of grouping.
 *
 * 2) GROUP DEFAULT (fallback)
 *    - If there is no explicit type override, we infer a group from VPORT_TYPE_GROUPS
 *      and return the group’s default layout.
 *    - Example: "barber" is in "Beauty & Wellness" => VPORT_SERVICE_TABS.
 *
 * 3) GLOBAL DEFAULT (last resort)
 *    - If type is missing or unknown => "Other" => VPORT_TABS.
 *
 * Important notes
 * ---------------
 * - This file expects a string like `vport_type` from DB/API (lowercased matching).
 * - `VPORT_TYPE_GROUPS` must include the type for group resolution to work.
 * - For gas stations, DB stores: "gas station" (with a space). This registry matches that.
 */
import {
  VPORT_TABS,
  VPORT_SERVICE_TABS,
  VPORT_FOOD_TABS,
  VPORT_GAS_TABS,
} from "@/features/profiles/config/profileTabs.config";

import { VPORT_TYPE_GROUPS } from "@/features/profiles/kinds/vport/config/vportTypes.config";

/**
 * VPORT Type → Tabs Registry
 * ==========================
 *
 * This module determines which tab layout a VPORT profile should use
 * based on its `vport_type` value from the database.
 *
 * Resolution Order
 * ----------------
 * 1) TYPE OVERRIDE (highest priority)
 *    If a specific type has a dedicated layout, it wins.
 *
 * 2) GROUP DEFAULT
 *    If no override exists, resolve the type’s group using
 *    VPORT_TYPE_GROUPS and return that group’s layout.
 *
 * 3) GLOBAL DEFAULT
 *    If type is missing or unknown, fall back to VPORT_TABS.
 *
 * Special Behavior
 * ----------------
 * - Gas stations always start on the "gas" tab.
 *   Even if the tab list changes, "gas" will be forced to index 0.
 */

/**
 * Normalize a type string for consistent matching.
 * - null/undefined => "other"
 * - force lowercase
 */
function normalizeType(v) {
  if (!v) return "other";
  return String(v).toLowerCase();
}

/**
 * Resolve the group label (key of VPORT_TYPE_GROUPS) for a given type.
 * Returns "Other" if the type is not found in any group.
 */
function resolveGroup(type) {
  const t = normalizeType(type);

  for (const [group, types] of Object.entries(VPORT_TYPE_GROUPS)) {
    if (types.includes(t)) return group;
  }

  return "Other";
}

/**
 * GROUP DEFAULTS
 * --------------
 * Maps a group name to its default tab layout.
 */
const GROUP_TABS = Object.freeze({
  "Beauty & Wellness": VPORT_SERVICE_TABS,
  "Food, Hospitality & Events": VPORT_FOOD_TABS,
  Other: VPORT_TABS,
});

/**
 * TYPE OVERRIDES
 * --------------
 * Only define entries here when a specific type must ignore
 * its group layout and use a dedicated layout.
 */
const TYPE_TABS = Object.freeze({
  "gas station": VPORT_GAS_TABS,
});

/**
 * Public API
 * ----------
 * Returns the tab layout array for a given vport type.
 *
 * @param {string|null|undefined} type
 * @returns {ReadonlyArray<{key: string, label: string}>}
 */
export function getVportTabsByType(type) {
  const t = normalizeType(type);

  // 1) TYPE OVERRIDE
  if (TYPE_TABS[t]) {
    const list = TYPE_TABS[t];

    // Special rule: gas station must always start on "gas"
    if (t === "gas station") {
      return [
        ...list.filter((x) => x.key === "gas"),
        ...list.filter((x) => x.key !== "gas"),
      ];
    }

    return list;
  }

  // 2) GROUP DEFAULT
  const group = resolveGroup(t);
  return GROUP_TABS[group] ?? GROUP_TABS.Other;
}