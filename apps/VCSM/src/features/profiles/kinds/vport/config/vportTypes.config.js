// src/features/profiles/kinds/vport/config/vportTypes.config.js

/**
 * VPORT Types Configuration
 * =========================
 *
 * IMPORTANT: The values in VPORT_TYPE_GROUPS MUST match the DB constraint:
 *   vc.vports.vport_type_check
 *
 * Rules:
 * - Types must be lowercase and match spacing exactly (ex: "gas station", "event planner").
 */

export const VPORT_TYPE_GROUPS = Object.freeze({
  "Arts, Media & Entertainment": [
    "artist",
    "creator",
    "dj",
    "event planner",
    "musician",
    "photographer",
    "public figure",
    "videographer",
  ],

  "Beauty & Wellness": [
    "barber",
    "barbershop",
    "esthetician",
    "fitness instructor",
    "hairstylist",
    "makeup artist",
    "massage therapist",
    "nail technician",
    "yoga instructor",
  ],

  "Education & Care": [
    "babysitter",
    "caregiver",
    "counselor",
    "elder care",
    "nanny",
    "teacher",
    "therapist",
    "tutor",
  ],

  "Food, Hospitality & Events": [
    "baker",
    "bartender",
    "caterer",
    "chef",
    "cook",
    "restaurant",
    "server",
  ],

  "Health & Medical": [
    "chiropractor",
    "dentist",
    "doctor",
    "nurse",
    "nutritionist",
  ],

  "Home, Maintenance & Trades": [
    "carpenter",
    "cleaning service",
    "contractor",
    "electrician",
    "gardener",
    "handyman",
    "landscaper",
    "locksmith",
    "mechanic",
    "painter",
    "plumber",
  ],

  "Professional & Business Services": [
    "accountant",
    "bookkeeper",
    "business",
    "consultant",
    "designer",
    "developer",
    "engineer",
    "lawyer",
    "marketer",
    "notary",
    "organization",
    "real estate",

    // ✅ NEW
    "exchange",
  ],

  "Retail, Sales & Commerce": ["nonprofit", "shop", "vendor"],

  "Sports & Fitness": ["athlete", "coach", "trainer"],

  "Transport & Logistics": [
    "courier",
    "delivery",
    "driver",
    "mover",
    "rideshare",
    "towing",
    "truck driver",
  ],

  "Gas & Fuel": ["gas station"],

  "Animal Care": ["dog walker", "pet sitter"],

  Other: ["other"],
});

// Maps a vport type to the category_key used in vport.service_catalog.
// A type alias means the form type shares an existing catalog — no DB duplication.
export const VPORT_SERVICE_CATALOG_ALIASES = Object.freeze({
  barbershop: "barber",
});

// Returns the canonical service catalog key for a given vport type.
export function resolveVportServiceCatalogType(vportType) {
  const normalized = String(vportType ?? "").trim().toLowerCase();
  return VPORT_SERVICE_CATALOG_ALIASES[normalized] ?? normalized;
}

export function getAllVportTypes() {
  return Object.values(VPORT_TYPE_GROUPS).flat();
}

export function isValidVportType(type) {
  return getAllVportTypes().includes(String(type).toLowerCase());
}