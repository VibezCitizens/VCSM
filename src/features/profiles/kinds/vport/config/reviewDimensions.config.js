// src/features/profiles/kinds/vport/config/reviewDimensions.config.js

const DEFAULT_DIMENSIONS = [
  { key: "service_quality", label: "Service Quality", weight: 1 },
];

const DIMENSIONS_BY_TYPE = {
  restaurant: [
    { key: "food", label: "Food", weight: 0.45 },
    { key: "service_quality", label: "Service", weight: 0.35 },
    { key: "restrooms", label: "Restrooms", weight: 0.20 },
  ],

  barber: [
    { key: "overall_experience", label: "Experience", weight: 0.50 },
    { key: "service_quality", label: "Service", weight: 0.35 },
    { key: "cleanliness", label: "Cleanliness", weight: 0.15 },
  ],

  gym: [
    { key: "equipment", label: "Equipment", weight: 0.45 },
    { key: "cleanliness", label: "Cleanliness", weight: 0.35 },
    { key: "staff", label: "Staff", weight: 0.20 },
  ],
};

const DIMENSIONS_BY_GROUP = {
  // Example: if you have a higher-level grouping
  food: DIMENSIONS_BY_TYPE.restaurant,
  grooming: DIMENSIONS_BY_TYPE.barber,
};

function normalizeKey(v) {
  return String(v || "").trim().toLowerCase();
}

export function getReviewDimensionsForVportType(vportType, group) {
  const t = normalizeKey(vportType);
  const g = normalizeKey(group);

  if (g && DIMENSIONS_BY_GROUP[g]) return DIMENSIONS_BY_GROUP[g];
  if (t && DIMENSIONS_BY_TYPE[t]) return DIMENSIONS_BY_TYPE[t];

  return DEFAULT_DIMENSIONS;
}
