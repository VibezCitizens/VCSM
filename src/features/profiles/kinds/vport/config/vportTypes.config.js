// src/features/vport/config/vportTypes.config.js

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
  ],
  "Retail, Sales & Commerce": [
    "nonprofit",
    "shop",
    "vendor",
  ],
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
  "Animal Care": ["dog walker", "pet sitter"],
  Other: ["other"],
});

export function getAllVportTypes() {
  return Object.values(VPORT_TYPE_GROUPS).flat();
}

export function isValidVportType(type) {
  return getAllVportTypes().includes(String(type).toLowerCase());
}
