// src/features/profiles/kinds/vport/config/reviewDimensions.config.js
import { VPORT_TYPE_GROUPS } from "@/features/profiles/kinds/vport/config/vportTypes.config";

const DEFAULT_DIMENSIONS = Object.freeze([
  { key: "service", label: "Service", weight: 0.22 },
  { key: "quality", label: "Quality", weight: 0.22 },
  { key: "value", label: "Value", weight: 0.22 },
  { key: "professionalism", label: "Professionalism", weight: 0.18 },
  { key: "overall_experience", label: "Overall Experience", weight: 0.16 },
]);

const DIMENSIONS_BY_GROUP = Object.freeze({
  "Food, Hospitality & Events": Object.freeze([
    { key: "service", label: "Service", weight: 0.22 },
    { key: "food", label: "Food", weight: 0.26 },
    { key: "quality", label: "Quality", weight: 0.20 },
    { key: "ambience", label: "Ambience", weight: 0.16 },
    { key: "value", label: "Value", weight: 0.16 },
  ]),
  "Beauty & Wellness": Object.freeze([
    { key: "service_quality", label: "Service", weight: 0.24 },
    { key: "results", label: "Results", weight: 0.24 },
    { key: "cleanliness", label: "Cleanliness", weight: 0.18 },
    { key: "professionalism", label: "Professionalism", weight: 0.18 },
    { key: "value", label: "Value", weight: 0.16 },
  ]),
  "Health & Medical": Object.freeze([
    { key: "care_quality", label: "Care Quality", weight: 0.28 },
    { key: "wait_time", label: "Wait Time", weight: 0.18 },
    { key: "communication", label: "Communication", weight: 0.20 },
    { key: "cleanliness", label: "Cleanliness", weight: 0.18 },
    { key: "overall_experience", label: "Overall Experience", weight: 0.16 },
  ]),
  "Home, Maintenance & Trades": Object.freeze([
    { key: "work_quality", label: "Work Quality", weight: 0.30 },
    { key: "timeliness", label: "Timeliness", weight: 0.20 },
    { key: "communication", label: "Communication", weight: 0.18 },
    { key: "professionalism", label: "Professionalism", weight: 0.16 },
    { key: "value", label: "Value", weight: 0.16 },
  ]),
  "Professional & Business Services": Object.freeze([
    { key: "expertise", label: "Expertise", weight: 0.28 },
    { key: "communication", label: "Communication", weight: 0.22 },
    { key: "timeliness", label: "Timeliness", weight: 0.18 },
    { key: "professionalism", label: "Professionalism", weight: 0.16 },
    { key: "value", label: "Value", weight: 0.16 },
  ]),
  "Transport & Logistics": Object.freeze([
    { key: "safety", label: "Safety", weight: 0.28 },
    { key: "punctuality", label: "Punctuality", weight: 0.20 },
    { key: "communication", label: "Communication", weight: 0.18 },
    { key: "professionalism", label: "Professionalism", weight: 0.18 },
    { key: "value", label: "Value", weight: 0.16 },
  ]),
  "Arts, Media & Entertainment": Object.freeze([
    { key: "creativity", label: "Creativity", weight: 0.28 },
    { key: "quality", label: "Quality", weight: 0.22 },
    { key: "communication", label: "Communication", weight: 0.18 },
    { key: "timeliness", label: "Timeliness", weight: 0.16 },
    { key: "value", label: "Value", weight: 0.16 },
  ]),
  "Education & Care": Object.freeze([
    { key: "care_quality", label: "Care Quality", weight: 0.28 },
    { key: "communication", label: "Communication", weight: 0.22 },
    { key: "reliability", label: "Reliability", weight: 0.18 },
    { key: "professionalism", label: "Professionalism", weight: 0.16 },
    { key: "value", label: "Value", weight: 0.16 },
  ]),
  "Retail, Sales & Commerce": Object.freeze([
    { key: "product_quality", label: "Product Quality", weight: 0.26 },
    { key: "selection", label: "Selection", weight: 0.20 },
    { key: "service_quality", label: "Service", weight: 0.20 },
    { key: "pricing", label: "Pricing", weight: 0.18 },
    { key: "value", label: "Value", weight: 0.16 },
  ]),
  "Sports & Fitness": Object.freeze([
    { key: "coaching_quality", label: "Coaching", weight: 0.28 },
    { key: "motivation", label: "Motivation", weight: 0.20 },
    { key: "facility", label: "Facility", weight: 0.20 },
    { key: "professionalism", label: "Professionalism", weight: 0.16 },
    { key: "value", label: "Value", weight: 0.16 },
  ]),
  "Gas & Fuel": Object.freeze([
    { key: "price_accuracy", label: "Price", weight: 0.28 },
    { key: "fuel_quality", label: "Fuel Quality", weight: 0.22 },
    { key: "service", label: "Service", weight: 0.18 },
    { key: "cleanliness", label: "Cleanliness", weight: 0.16 },
    { key: "value", label: "Value", weight: 0.16 },
  ]),
  "Animal Care": Object.freeze([
    { key: "care_quality", label: "Care Quality", weight: 0.30 },
    { key: "reliability", label: "Reliability", weight: 0.20 },
    { key: "communication", label: "Communication", weight: 0.18 },
    { key: "professionalism", label: "Professionalism", weight: 0.16 },
    { key: "value", label: "Value", weight: 0.16 },
  ]),
  Other: DEFAULT_DIMENSIONS,
});

const DIMENSIONS_BY_TYPE = Object.freeze({
  restaurant: DIMENSIONS_BY_GROUP["Food, Hospitality & Events"],
  barber: DIMENSIONS_BY_GROUP["Beauty & Wellness"],
  "gas station": DIMENSIONS_BY_GROUP["Gas & Fuel"],
});

function normalizeKey(v) {
  return String(v || "").trim().toLowerCase();
}

function resolveGroupFromVportType(vportType) {
  const t = normalizeKey(vportType);
  if (!t) return null;

  for (const [groupName, types] of Object.entries(VPORT_TYPE_GROUPS)) {
    const hit = (types ?? []).some((x) => normalizeKey(x) === t);
    if (hit) return groupName;
  }

  return null;
}

export function getReviewDimensionsForVportType(vportType, group) {
  const t = normalizeKey(vportType);
  const g = normalizeKey(group);

  if (t && DIMENSIONS_BY_TYPE[t]) return DIMENSIONS_BY_TYPE[t];

  if (g) {
    const exactGroup = Object.keys(DIMENSIONS_BY_GROUP).find((k) => normalizeKey(k) === g);
    if (exactGroup) return DIMENSIONS_BY_GROUP[exactGroup];
  }

  const resolvedGroup = resolveGroupFromVportType(t);
  if (resolvedGroup && DIMENSIONS_BY_GROUP[resolvedGroup]) {
    return DIMENSIONS_BY_GROUP[resolvedGroup];
  }

  return DEFAULT_DIMENSIONS;
}
