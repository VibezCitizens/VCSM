export const BUSINESS_TYPE_GROUPS = Object.freeze({
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

export const BUSINESS_TYPES = Object.values(BUSINESS_TYPE_GROUPS).flat();

export function labelForType(type) {
  return String(type ?? "").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function serviceKeyCandidates(type) {
  const clean = String(type || "").trim().toLowerCase();
  if (!clean) return [];
  return [
    clean,
    clean.replace(/\s+/g, "_"),
    clean.replace(/\s+/g, "-"),
  ];
}
