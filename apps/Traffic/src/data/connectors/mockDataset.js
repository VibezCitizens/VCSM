/**
 * DEV ONLY — not used by runtime TRAZE directory.
 *
 * Structural taxonomy (countries, cities, services) has moved to:
 *   @/data/connectors/taxonomyDataset.js
 *
 * Provider data (profiles, stats, price aggregates) below is retained
 * for reference only. No runtime route or repository imports this file.
 * Safe to delete once dev seeding workflows no longer need it.
 */

/** @typedef {import("@/data/types").Provider} Provider */
/** @typedef {import("@/data/types").ProviderService} ProviderService */
/** @typedef {import("@/data/types").ProviderStats} ProviderStats */
/** @typedef {import("@/data/types").PriceAggregate} PriceAggregate */

import { MOCK_PROVIDERS_A } from "./mockProviders.a";
import { MOCK_PROVIDERS_B } from "./mockProviders.b";
import { MOCK_PROVIDERS_C } from "./mockProviders.c";

export { MOCK_PRICE_AGGREGATES } from "./mockPriceAggregates";

/** @type {Provider[]} */
export const MOCK_PROVIDERS = [...MOCK_PROVIDERS_A, ...MOCK_PROVIDERS_B, ...MOCK_PROVIDERS_C];

/** @type {ProviderService[]} */
export const MOCK_PROVIDER_SERVICES = [
  { id: "ps-1", providerId: "pro-luna-cuts", serviceId: "svc-barber", specialtyId: "spec-curly-fade", priceFromCents: 4500, priceToCents: 6500, currencyCode: "USD", isActive: true },
  { id: "ps-2", providerId: "pro-luna-cuts", serviceId: "svc-barber", specialtyId: "spec-taper-fade", priceFromCents: 4000, priceToCents: 6200, currencyCode: "USD", isActive: true },
  { id: "ps-2a", providerId: "pro-luna-cuts", serviceId: "svc-barber", specialtyId: "spec-beard-trim", priceFromCents: 2500, priceToCents: 3500, currencyCode: "USD", isActive: true },

  // Mission Fade House — SF
  { id: "ps-b1", providerId: "pro-mission-fade-house", serviceId: "svc-barber", specialtyId: "spec-fade", priceFromCents: 3800, priceToCents: 5500, currencyCode: "USD", isActive: true },
  { id: "ps-b2", providerId: "pro-mission-fade-house", serviceId: "svc-barber", specialtyId: "spec-line-up", priceFromCents: 2000, priceToCents: 3000, currencyCode: "USD", isActive: true },
  { id: "ps-b3", providerId: "pro-mission-fade-house", serviceId: "svc-barber", specialtyId: "spec-design-work", priceFromCents: 5500, priceToCents: 8000, currencyCode: "USD", isActive: true },

  // Golden Gate Grooming — SF
  { id: "ps-b4", providerId: "pro-golden-gate-grooming", serviceId: "svc-barber", specialtyId: "spec-razor-shave", priceFromCents: 4000, priceToCents: 5500, currencyCode: "USD", isActive: true },
  { id: "ps-b5", providerId: "pro-golden-gate-grooming", serviceId: "svc-barber", specialtyId: "spec-beard-trim", priceFromCents: 2500, priceToCents: 4000, currencyCode: "USD", isActive: true },
  { id: "ps-b6", providerId: "pro-golden-gate-grooming", serviceId: "svc-barber", specialtyId: "spec-taper-fade", priceFromCents: 4200, priceToCents: 6000, currencyCode: "USD", isActive: true },

  // Wynwood Clippers — Miami
  { id: "ps-b7", providerId: "pro-wynwood-clippers", serviceId: "svc-barber", specialtyId: "spec-fade", priceFromCents: 3500, priceToCents: 5000, currencyCode: "USD", isActive: true },
  { id: "ps-b8", providerId: "pro-wynwood-clippers", serviceId: "svc-barber", specialtyId: "spec-kids-cuts", priceFromCents: 2000, priceToCents: 3000, currencyCode: "USD", isActive: true },
  { id: "ps-b9", providerId: "pro-wynwood-clippers", serviceId: "svc-barber", specialtyId: "spec-line-up", priceFromCents: 1800, priceToCents: 2800, currencyCode: "USD", isActive: true },

  // Little Havana Barber Studio — Miami
  { id: "ps-b10", providerId: "pro-little-havana-barber-studio", serviceId: "svc-barber", specialtyId: "spec-taper-fade", priceFromCents: 3200, priceToCents: 4800, currencyCode: "USD", isActive: true },
  { id: "ps-b11", providerId: "pro-little-havana-barber-studio", serviceId: "svc-barber", specialtyId: "spec-razor-shave", priceFromCents: 3500, priceToCents: 5000, currencyCode: "USD", isActive: true },
  { id: "ps-b12", providerId: "pro-little-havana-barber-studio", serviceId: "svc-barber", specialtyId: "spec-beard-trim", priceFromCents: 2000, priceToCents: 3200, currencyCode: "USD", isActive: true },

  // East End Fades — London
  { id: "ps-b13", providerId: "pro-east-end-fades", serviceId: "svc-barber", specialtyId: "spec-fade", priceFromCents: 2800, priceToCents: 4200, currencyCode: "GBP", isActive: true },
  { id: "ps-b14", providerId: "pro-east-end-fades", serviceId: "svc-barber", specialtyId: "spec-design-work", priceFromCents: 4500, priceToCents: 6500, currencyCode: "GBP", isActive: true },
  { id: "ps-b15", providerId: "pro-east-end-fades", serviceId: "svc-barber", specialtyId: "spec-line-up", priceFromCents: 1500, priceToCents: 2500, currencyCode: "GBP", isActive: true },

  // Soho Barber Club — London
  { id: "ps-b16", providerId: "pro-soho-barber-club", serviceId: "svc-barber", specialtyId: "spec-razor-shave", priceFromCents: 3500, priceToCents: 5500, currencyCode: "GBP", isActive: true },
  { id: "ps-b17", providerId: "pro-soho-barber-club", serviceId: "svc-barber", specialtyId: "spec-beard-trim", priceFromCents: 2200, priceToCents: 3500, currencyCode: "GBP", isActive: true },
  { id: "ps-b18", providerId: "pro-soho-barber-club", serviceId: "svc-barber", specialtyId: "spec-taper-fade", priceFromCents: 3200, priceToCents: 4800, currencyCode: "GBP", isActive: true },

  // Berlin Razor Co — Berlin
  { id: "ps-b19", providerId: "pro-berlin-razor-co", serviceId: "svc-barber", specialtyId: "spec-razor-shave", priceFromCents: 2800, priceToCents: 4200, currencyCode: "EUR", isActive: true },
  { id: "ps-b20", providerId: "pro-berlin-razor-co", serviceId: "svc-barber", specialtyId: "spec-fade", priceFromCents: 2500, priceToCents: 3800, currencyCode: "EUR", isActive: true },
  { id: "ps-b21", providerId: "pro-berlin-razor-co", serviceId: "svc-barber", specialtyId: "spec-house-call-barber", priceFromCents: 5000, priceToCents: 7500, currencyCode: "EUR", isActive: true },

  // Kreuzberg Cuts — Berlin
  { id: "ps-b22", providerId: "pro-kreuzberg-cuts", serviceId: "svc-barber", specialtyId: "spec-fade", priceFromCents: 2200, priceToCents: 3500, currencyCode: "EUR", isActive: true },
  { id: "ps-b23", providerId: "pro-kreuzberg-cuts", serviceId: "svc-barber", specialtyId: "spec-kids-cuts", priceFromCents: 1500, priceToCents: 2500, currencyCode: "EUR", isActive: true },
  { id: "ps-b24", providerId: "pro-kreuzberg-cuts", serviceId: "svc-barber", specialtyId: "spec-house-call-barber", priceFromCents: 4500, priceToCents: 7000, currencyCode: "EUR", isActive: true },

  { id: "ps-3", providerId: "pro-tripoint-lock", serviceId: "svc-locksmith", specialtyId: "spec-emergency-lockout", priceFromCents: 7500, priceToCents: 15000, currencyCode: "USD", isActive: true },
  { id: "ps-4", providerId: "pro-tripoint-lock", serviceId: "svc-locksmith", specialtyId: "spec-smart-lock-install", priceFromCents: 12000, priceToCents: 25000, currencyCode: "USD", isActive: true },
  { id: "ps-3a", providerId: "pro-tripoint-lock", serviceId: "svc-locksmith", specialtyId: "spec-car-lockout", priceFromCents: 8000, priceToCents: 16000, currencyCode: "USD", isActive: true },
  { id: "ps-3b", providerId: "pro-tripoint-lock", serviceId: "svc-locksmith", specialtyId: "spec-rekey", priceFromCents: 9000, priceToCents: 17000, currencyCode: "USD", isActive: true },
  { id: "ps-5", providerId: "pro-miami-secure", serviceId: "svc-locksmith", specialtyId: "spec-residential-lockout", priceFromCents: 6200, priceToCents: 12800, currencyCode: "USD", isActive: true },
  { id: "ps-5a", providerId: "pro-miami-secure", serviceId: "svc-locksmith", specialtyId: "spec-car-lockout", priceFromCents: 7000, priceToCents: 14000, currencyCode: "USD", isActive: true },
  { id: "ps-5b", providerId: "pro-miami-secure", serviceId: "svc-locksmith", specialtyId: "spec-mobile-locksmith", priceFromCents: 6500, priceToCents: 12500, currencyCode: "USD", isActive: true },
  { id: "ps-6", providerId: "pro-coastline-glam", serviceId: "svc-makeup", specialtyId: "spec-bridal", priceFromCents: 15500, priceToCents: 28500, currencyCode: "USD", isActive: true },
  { id: "ps-7", providerId: "pro-maple-lock", serviceId: "svc-locksmith", specialtyId: "spec-rekey", priceFromCents: 9000, priceToCents: 18000, currencyCode: "CAD", isActive: true },
  { id: "ps-8", providerId: "pro-roma-segura", serviceId: "svc-locksmith", specialtyId: "spec-lock-change", priceFromCents: 120000, priceToCents: 260000, currencyCode: "MXN", isActive: true },
  { id: "ps-9", providerId: "pro-shoreditch-locksmith", serviceId: "svc-locksmith", specialtyId: "spec-emergency-lockout", priceFromCents: 8500, priceToCents: 22000, currencyCode: "GBP", isActive: true },
  { id: "ps-10", providerId: "pro-madrid-llaves", serviceId: "svc-locksmith", specialtyId: "spec-car-lockout", priceFromCents: 6500, priceToCents: 17000, currencyCode: "EUR", isActive: true },
  { id: "ps-11", providerId: "pro-paris-serrure", serviceId: "svc-locksmith", specialtyId: "spec-lock-repair", priceFromCents: 7800, priceToCents: 21000, currencyCode: "EUR", isActive: true },
  { id: "ps-12", providerId: "pro-berlin-schloss", serviceId: "svc-locksmith", specialtyId: "spec-commercial-locksmith", priceFromCents: 9000, priceToCents: 24000, currencyCode: "EUR", isActive: true },
  { id: "ps-13", providerId: "pro-dubai-key-rescue", serviceId: "svc-locksmith", specialtyId: "spec-emergency-lockout", priceFromCents: 18000, priceToCents: 42000, currencyCode: "AED", isActive: true },
  { id: "ps-14", providerId: "pro-sao-chave-pronta", serviceId: "svc-locksmith", specialtyId: "spec-rekey", priceFromCents: 22000, priceToCents: 59000, currencyCode: "BRL", isActive: true },
  { id: "ps-15", providerId: "pro-mumbai-lock-care", serviceId: "svc-locksmith", specialtyId: "spec-lock-change", priceFromCents: 250000, priceToCents: 700000, currencyCode: "INR", isActive: true },

  // Mission District Mobile Locksmith — SF
  { id: "ps-l1", providerId: "pro-mission-mobile-locksmith", serviceId: "svc-locksmith", specialtyId: "spec-residential-lockout", priceFromCents: 6500, priceToCents: 12000, currencyCode: "USD", isActive: true },
  { id: "ps-l2", providerId: "pro-mission-mobile-locksmith", serviceId: "svc-locksmith", specialtyId: "spec-rekey", priceFromCents: 8500, priceToCents: 16000, currencyCode: "USD", isActive: true },
  { id: "ps-l3", providerId: "pro-mission-mobile-locksmith", serviceId: "svc-locksmith", specialtyId: "spec-smart-lock-install", priceFromCents: 11000, priceToCents: 22000, currencyCode: "USD", isActive: true },
  { id: "ps-l4", providerId: "pro-mission-mobile-locksmith", serviceId: "svc-locksmith", specialtyId: "spec-mobile-locksmith", priceFromCents: 7500, priceToCents: 14000, currencyCode: "USD", isActive: true },

  // Golden Gate Lock Response — SF
  { id: "ps-l5", providerId: "pro-golden-gate-lock-response", serviceId: "svc-locksmith", specialtyId: "spec-emergency-lockout", priceFromCents: 8500, priceToCents: 17500, currencyCode: "USD", isActive: true },
  { id: "ps-l6", providerId: "pro-golden-gate-lock-response", serviceId: "svc-locksmith", specialtyId: "spec-commercial-locksmith", priceFromCents: 12000, priceToCents: 28000, currencyCode: "USD", isActive: true },
  { id: "ps-l7", providerId: "pro-golden-gate-lock-response", serviceId: "svc-locksmith", specialtyId: "spec-ignition-key-programming", priceFromCents: 15000, priceToCents: 32000, currencyCode: "USD", isActive: true },
  { id: "ps-l8", providerId: "pro-golden-gate-lock-response", serviceId: "svc-locksmith", specialtyId: "spec-after-hours-locksmith", priceFromCents: 9500, priceToCents: 20000, currencyCode: "USD", isActive: true },

  // Wynwood Lock & Key — Miami
  { id: "ps-l9", providerId: "pro-wynwood-lock-key", serviceId: "svc-locksmith", specialtyId: "spec-emergency-lockout", priceFromCents: 6000, priceToCents: 13000, currencyCode: "USD", isActive: true },
  { id: "ps-l10", providerId: "pro-wynwood-lock-key", serviceId: "svc-locksmith", specialtyId: "spec-lock-change", priceFromCents: 8000, priceToCents: 18000, currencyCode: "USD", isActive: true },
  { id: "ps-l11", providerId: "pro-wynwood-lock-key", serviceId: "svc-locksmith", specialtyId: "spec-key-duplication", priceFromCents: 1500, priceToCents: 4500, currencyCode: "USD", isActive: true },
  { id: "ps-l12", providerId: "pro-wynwood-lock-key", serviceId: "svc-locksmith", specialtyId: "spec-mobile-locksmith", priceFromCents: 7000, priceToCents: 13500, currencyCode: "USD", isActive: true },

  // London Key Response
  { id: "ps-l13", providerId: "pro-london-key-response", serviceId: "svc-locksmith", specialtyId: "spec-emergency-lockout", priceFromCents: 9000, priceToCents: 20000, currencyCode: "GBP", isActive: true },
  { id: "ps-l14", providerId: "pro-london-key-response", serviceId: "svc-locksmith", specialtyId: "spec-car-lockout", priceFromCents: 7500, priceToCents: 18000, currencyCode: "GBP", isActive: true },
  { id: "ps-l15", providerId: "pro-london-key-response", serviceId: "svc-locksmith", specialtyId: "spec-ignition-key-programming", priceFromCents: 12000, priceToCents: 28000, currencyCode: "GBP", isActive: true },
  { id: "ps-l16", providerId: "pro-london-key-response", serviceId: "svc-locksmith", specialtyId: "spec-after-hours-locksmith", priceFromCents: 10000, priceToCents: 24000, currencyCode: "GBP", isActive: true },

  // Soho Locksmith Central — London
  { id: "ps-l17", providerId: "pro-soho-locksmith-central", serviceId: "svc-locksmith", specialtyId: "spec-key-duplication", priceFromCents: 1200, priceToCents: 3500, currencyCode: "GBP", isActive: true },
  { id: "ps-l18", providerId: "pro-soho-locksmith-central", serviceId: "svc-locksmith", specialtyId: "spec-lock-repair", priceFromCents: 6500, priceToCents: 16000, currencyCode: "GBP", isActive: true },
  { id: "ps-l19", providerId: "pro-soho-locksmith-central", serviceId: "svc-locksmith", specialtyId: "spec-smart-lock-install", priceFromCents: 10000, priceToCents: 25000, currencyCode: "GBP", isActive: true },

  // Berlin Lock Help
  { id: "ps-l20", providerId: "pro-berlin-lock-help", serviceId: "svc-locksmith", specialtyId: "spec-residential-lockout", priceFromCents: 7000, priceToCents: 16000, currencyCode: "EUR", isActive: true },
  { id: "ps-l21", providerId: "pro-berlin-lock-help", serviceId: "svc-locksmith", specialtyId: "spec-commercial-locksmith", priceFromCents: 9500, priceToCents: 22000, currencyCode: "EUR", isActive: true },
  { id: "ps-l22", providerId: "pro-berlin-lock-help", serviceId: "svc-locksmith", specialtyId: "spec-after-hours-locksmith", priceFromCents: 8500, priceToCents: 19000, currencyCode: "EUR", isActive: true },
  { id: "ps-l23", providerId: "pro-berlin-lock-help", serviceId: "svc-locksmith", specialtyId: "spec-lock-repair", priceFromCents: 6000, priceToCents: 14000, currencyCode: "EUR", isActive: true },

  // Kreuzberg Mobile Key Service — Berlin
  { id: "ps-l24", providerId: "pro-kreuzberg-mobile-key", serviceId: "svc-locksmith", specialtyId: "spec-emergency-lockout", priceFromCents: 7500, priceToCents: 17000, currencyCode: "EUR", isActive: true },
  { id: "ps-l25", providerId: "pro-kreuzberg-mobile-key", serviceId: "svc-locksmith", specialtyId: "spec-ignition-key-programming", priceFromCents: 11000, priceToCents: 26000, currencyCode: "EUR", isActive: true },
  { id: "ps-l26", providerId: "pro-kreuzberg-mobile-key", serviceId: "svc-locksmith", specialtyId: "spec-rekey", priceFromCents: 6500, priceToCents: 15000, currencyCode: "EUR", isActive: true },
  { id: "ps-l27", providerId: "pro-kreuzberg-mobile-key", serviceId: "svc-locksmith", specialtyId: "spec-mobile-locksmith", priceFromCents: 7000, priceToCents: 16000, currencyCode: "EUR", isActive: true }
];

/** @type {ProviderStats[]} */
export const MOCK_PROVIDER_STATS = [
  { providerId: "pro-luna-cuts", ratingAvg: 4.9, reviewCount: 231, bookingCount30d: 128, responseRate: 98, responseTimeP50Minutes: 4, rankScore: 93.2, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-mission-fade-house", ratingAvg: 4.8, reviewCount: 187, bookingCount30d: 102, responseRate: 97, responseTimeP50Minutes: 5, rankScore: 91.5, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-golden-gate-grooming", ratingAvg: 4.7, reviewCount: 94, bookingCount30d: 56, responseRate: 92, responseTimeP50Minutes: 12, rankScore: 82.4, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-wynwood-clippers", ratingAvg: 4.9, reviewCount: 162, bookingCount30d: 89, responseRate: 99, responseTimeP50Minutes: 3, rankScore: 92.1, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-little-havana-barber-studio", ratingAvg: 4.8, reviewCount: 134, bookingCount30d: 74, responseRate: 95, responseTimeP50Minutes: 8, rankScore: 87.6, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-east-end-fades", ratingAvg: 4.7, reviewCount: 78, bookingCount30d: 45, responseRate: 93, responseTimeP50Minutes: 10, rankScore: 80.9, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-soho-barber-club", ratingAvg: 4.9, reviewCount: 205, bookingCount30d: 98, responseRate: 98, responseTimeP50Minutes: 6, rankScore: 91.8, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-berlin-razor-co", ratingAvg: 4.8, reviewCount: 112, bookingCount30d: 63, responseRate: 96, responseTimeP50Minutes: 7, rankScore: 86.7, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-kreuzberg-cuts", ratingAvg: 4.6, reviewCount: 67, bookingCount30d: 41, responseRate: 91, responseTimeP50Minutes: 14, rankScore: 78.3, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-tripoint-lock", ratingAvg: 4.9, reviewCount: 96, bookingCount30d: 47, responseRate: 99, responseTimeP50Minutes: 8, rankScore: 90.3, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-miami-secure", ratingAvg: 4.8, reviewCount: 112, bookingCount30d: 71, responseRate: 97, responseTimeP50Minutes: 10, rankScore: 88.1, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-coastline-glam", ratingAvg: 5.0, reviewCount: 88, bookingCount30d: 39, responseRate: 96, responseTimeP50Minutes: 7, rankScore: 86.2, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-maple-lock", ratingAvg: 4.7, reviewCount: 76, bookingCount30d: 29, responseRate: 94, responseTimeP50Minutes: 14, rankScore: 79.2, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-roma-segura", ratingAvg: 4.8, reviewCount: 61, bookingCount30d: 33, responseRate: 95, responseTimeP50Minutes: 16, rankScore: 80.8, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-shoreditch-locksmith", ratingAvg: 4.8, reviewCount: 83, bookingCount30d: 40, responseRate: 97, responseTimeP50Minutes: 11, rankScore: 84.1, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-madrid-llaves", ratingAvg: 4.6, reviewCount: 57, bookingCount30d: 25, responseRate: 93, responseTimeP50Minutes: 18, rankScore: 76.4, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-paris-serrure", ratingAvg: 4.7, reviewCount: 69, bookingCount30d: 31, responseRate: 94, responseTimeP50Minutes: 15, rankScore: 80.2, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-berlin-schloss", ratingAvg: 4.7, reviewCount: 64, bookingCount30d: 28, responseRate: 95, responseTimeP50Minutes: 13, rankScore: 79.5, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-dubai-key-rescue", ratingAvg: 4.8, reviewCount: 51, bookingCount30d: 34, responseRate: 98, responseTimeP50Minutes: 9, rankScore: 82.9, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-sao-chave-pronta", ratingAvg: 4.6, reviewCount: 44, bookingCount30d: 23, responseRate: 93, responseTimeP50Minutes: 17, rankScore: 74.8, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-mumbai-lock-care", ratingAvg: 4.7, reviewCount: 58, bookingCount30d: 37, responseRate: 96, responseTimeP50Minutes: 12, rankScore: 81.3, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-mission-mobile-locksmith", ratingAvg: 4.8, reviewCount: 74, bookingCount30d: 42, responseRate: 98, responseTimeP50Minutes: 6, rankScore: 87.4, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-golden-gate-lock-response", ratingAvg: 4.6, reviewCount: 53, bookingCount30d: 31, responseRate: 94, responseTimeP50Minutes: 15, rankScore: 78.9, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-wynwood-lock-key", ratingAvg: 4.9, reviewCount: 89, bookingCount30d: 55, responseRate: 99, responseTimeP50Minutes: 7, rankScore: 89.7, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-london-key-response", ratingAvg: 4.8, reviewCount: 102, bookingCount30d: 58, responseRate: 97, responseTimeP50Minutes: 9, rankScore: 86.5, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-soho-locksmith-central", ratingAvg: 4.7, reviewCount: 61, bookingCount30d: 28, responseRate: 93, responseTimeP50Minutes: 11, rankScore: 79.8, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-berlin-lock-help", ratingAvg: 4.7, reviewCount: 72, bookingCount30d: 35, responseRate: 95, responseTimeP50Minutes: 13, rankScore: 81.6, updatedAt: "2026-04-12T00:00:00Z" },
  { providerId: "pro-kreuzberg-mobile-key", ratingAvg: 4.5, reviewCount: 41, bookingCount30d: 22, responseRate: 91, responseTimeP50Minutes: 16, rankScore: 74.2, updatedAt: "2026-04-12T00:00:00Z" }
];
