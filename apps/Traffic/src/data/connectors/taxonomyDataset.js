/**
 * TRAZE static taxonomy — geo, city, and service definitions.
 *
 * This file defines the structural data that drives TRAZE's SEO route
 * topology: which countries, regions, cities, neighborhoods, and service
 * categories exist in the directory.
 *
 * This is NOT provider data. Provider profiles come from Supabase via
 * vportDataset.js. This file has no dependency on Supabase and never
 * throws at build time.
 */

/** @typedef {import("@/data/types").Country} Country */
/** @typedef {import("@/data/types").Region} Region */
/** @typedef {import("@/data/types").City} City */
/** @typedef {import("@/data/types").Neighborhood} Neighborhood */
/** @typedef {import("@/data/types").Service} Service */
/** @typedef {import("@/data/types").Specialty} Specialty */

// ─── Countries ────────────────────────────────────────────────────────────────

/** @type {Country[]} */
export const COUNTRIES = [
  {
    id: "country-us",
    code: "US",
    slug: "us",
    name: "United States",
    defaultLocale: "en-US",
    defaultCurrencyCode: "USD",
    isActive: true
  },
  {
    id: "country-ca",
    code: "CA",
    slug: "canada",
    name: "Canada",
    defaultLocale: "en-CA",
    defaultCurrencyCode: "CAD",
    isActive: true
  },
  {
    id: "country-mx",
    code: "MX",
    slug: "mexico",
    name: "Mexico",
    defaultLocale: "es-MX",
    defaultCurrencyCode: "MXN",
    isActive: true
  },
  {
    id: "country-gb",
    code: "GB",
    slug: "uk",
    name: "United Kingdom",
    defaultLocale: "en-GB",
    defaultCurrencyCode: "GBP",
    isActive: true
  },
  {
    id: "country-es",
    code: "ES",
    slug: "spain",
    name: "Spain",
    defaultLocale: "es-ES",
    defaultCurrencyCode: "EUR",
    isActive: true
  },
  {
    id: "country-fr",
    code: "FR",
    slug: "france",
    name: "France",
    defaultLocale: "fr-FR",
    defaultCurrencyCode: "EUR",
    isActive: true
  },
  {
    id: "country-de",
    code: "DE",
    slug: "germany",
    name: "Germany",
    defaultLocale: "de-DE",
    defaultCurrencyCode: "EUR",
    isActive: true
  },
  {
    id: "country-ae",
    code: "AE",
    slug: "uae",
    name: "United Arab Emirates",
    defaultLocale: "en-AE",
    defaultCurrencyCode: "AED",
    isActive: true
  },
  {
    id: "country-br",
    code: "BR",
    slug: "brazil",
    name: "Brazil",
    defaultLocale: "pt-BR",
    defaultCurrencyCode: "BRL",
    isActive: true
  },
  {
    id: "country-in",
    code: "IN",
    slug: "india",
    name: "India",
    defaultLocale: "en-IN",
    defaultCurrencyCode: "INR",
    isActive: true
  }
];

// ─── Regions ──────────────────────────────────────────────────────────────────

/** @type {Region[]} */
export const REGIONS = [
  { id: "region-us-ca",   countryId: "country-us", code: "CA",   slug: "california",       name: "California",           type: "state",    isActive: true },
  { id: "region-us-fl",   countryId: "country-us", code: "FL",   slug: "florida",           name: "Florida",              type: "state",    isActive: true },
  { id: "region-us-tx",   countryId: "country-us", code: "TX",   slug: "texas",             name: "Texas",                type: "state",    isActive: true },
  { id: "region-ca-on",   countryId: "country-ca", code: "ON",   slug: "ontario",           name: "Ontario",              type: "province", isActive: true },
  { id: "region-mx-cdmx", countryId: "country-mx", code: "CDMX", slug: "ciudad-de-mexico",  name: "Ciudad de Mexico",     type: "state",    isActive: true },
  { id: "region-gb-eng",  countryId: "country-gb", code: "ENG",  slug: "england",           name: "England",              type: "county",   isActive: true },
  { id: "region-es-md",   countryId: "country-es", code: "MD",   slug: "madrid",            name: "Comunidad de Madrid",  type: "department", isActive: true },
  { id: "region-fr-idf",  countryId: "country-fr", code: "IDF",  slug: "ile-de-france",     name: "Ile-de-France",        type: "department", isActive: true },
  { id: "region-de-be",   countryId: "country-de", code: "BE",   slug: "berlin",            name: "Berlin",               type: "state",    isActive: true },
  { id: "region-ae-du",   countryId: "country-ae", code: "DU",   slug: "dubai",             name: "Dubai",                type: "emirate",  isActive: true },
  { id: "region-br-sp",   countryId: "country-br", code: "SP",   slug: "sao-paulo",         name: "Sao Paulo",            type: "state",    isActive: true },
  { id: "region-in-mh",   countryId: "country-in", code: "MH",   slug: "maharashtra",       name: "Maharashtra",          type: "state",    isActive: true }
];

// ─── Cities ───────────────────────────────────────────────────────────────────

/** @type {City[]} */
export const CITIES = [
  {
    id: "city-sf",
    countryId: "country-us",
    regionId: "region-us-ca",
    slug: "san-francisco",
    name: "San Francisco",
    stateCode: "CA",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    isActive: true
  },
  {
    id: "city-miami",
    countryId: "country-us",
    regionId: "region-us-fl",
    slug: "miami",
    name: "Miami",
    stateCode: "FL",
    countryCode: "US",
    timezone: "America/New_York",
    isActive: true
  },
  {
    id: "city-toronto",
    countryId: "country-ca",
    regionId: "region-ca-on",
    slug: "toronto",
    name: "Toronto",
    stateCode: null,
    countryCode: "CA",
    timezone: "America/Toronto",
    isActive: true
  },
  {
    id: "city-mexico-city",
    countryId: "country-mx",
    regionId: "region-mx-cdmx",
    slug: "mexico-city",
    name: "Mexico City",
    stateCode: null,
    countryCode: "MX",
    timezone: "America/Mexico_City",
    isActive: true
  },
  {
    id: "city-london",
    countryId: "country-gb",
    regionId: "region-gb-eng",
    slug: "london",
    name: "London",
    stateCode: null,
    countryCode: "GB",
    timezone: "Europe/London",
    isActive: true
  },
  {
    id: "city-madrid",
    countryId: "country-es",
    regionId: "region-es-md",
    slug: "madrid",
    name: "Madrid",
    stateCode: null,
    countryCode: "ES",
    timezone: "Europe/Madrid",
    isActive: true
  },
  {
    id: "city-paris",
    countryId: "country-fr",
    regionId: "region-fr-idf",
    slug: "paris",
    name: "Paris",
    stateCode: null,
    countryCode: "FR",
    timezone: "Europe/Paris",
    isActive: true
  },
  {
    id: "city-berlin",
    countryId: "country-de",
    regionId: "region-de-be",
    slug: "berlin",
    name: "Berlin",
    stateCode: null,
    countryCode: "DE",
    timezone: "Europe/Berlin",
    isActive: true
  },
  {
    id: "city-dubai",
    countryId: "country-ae",
    regionId: "region-ae-du",
    slug: "dubai",
    name: "Dubai",
    stateCode: null,
    countryCode: "AE",
    timezone: "Asia/Dubai",
    isActive: true
  },
  {
    id: "city-sao-paulo",
    countryId: "country-br",
    regionId: "region-br-sp",
    slug: "sao-paulo",
    name: "Sao Paulo",
    stateCode: null,
    countryCode: "BR",
    timezone: "America/Sao_Paulo",
    isActive: true
  },
  {
    id: "city-mumbai",
    countryId: "country-in",
    regionId: "region-in-mh",
    slug: "mumbai",
    name: "Mumbai",
    stateCode: null,
    countryCode: "IN",
    timezone: "Asia/Kolkata",
    isActive: true
  },
  {
    id: "city-laredo",
    countryId: "country-us",
    regionId: "region-us-tx",
    slug: "laredo",
    name: "Laredo",
    stateCode: "TX",
    countryCode: "US",
    timezone: "America/Chicago",
    isActive: true
  }
];

// ─── Neighborhoods / Localities ───────────────────────────────────────────────

/** @type {Neighborhood[]} */
export const NEIGHBORHOODS = [
  { id: "loc-sf-mission",        cityId: "city-sf",          slug: "mission-district", name: "Mission District", localityType: "district",    isActive: true },
  { id: "loc-sf-soma",           cityId: "city-sf",          slug: "soma",             name: "SoMa",             localityType: "district",    isActive: true },
  { id: "loc-miami-brickell",    cityId: "city-miami",       slug: "brickell",         name: "Brickell",         localityType: "neighborhood", isActive: true },
  { id: "loc-miami-wynwood",     cityId: "city-miami",       slug: "wynwood",          name: "Wynwood",          localityType: "neighborhood", isActive: true },
  { id: "loc-miami-little-havana", cityId: "city-miami",     slug: "little-havana",    name: "Little Havana",    localityType: "neighborhood", isActive: true },
  { id: "loc-toronto-old-town",  cityId: "city-toronto",     slug: "old-town",         name: "Old Town",         localityType: "borough",     isActive: true },
  { id: "loc-mx-roma",           cityId: "city-mexico-city", slug: "roma-norte",       name: "Roma Norte",       localityType: "district",    isActive: true },
  { id: "loc-london-shoreditch", cityId: "city-london",      slug: "shoreditch",       name: "Shoreditch",       localityType: "borough",     isActive: true },
  { id: "loc-london-east-end",   cityId: "city-london",      slug: "east-end",         name: "East End",         localityType: "borough",     isActive: true },
  { id: "loc-london-soho",       cityId: "city-london",      slug: "soho",             name: "Soho",             localityType: "district",    isActive: true },
  { id: "loc-madrid-salamanca",  cityId: "city-madrid",      slug: "salamanca",        name: "Salamanca",        localityType: "district",    isActive: true },
  { id: "loc-paris-marais",      cityId: "city-paris",       slug: "le-marais",        name: "Le Marais",        localityType: "district",    isActive: true },
  { id: "loc-berlin-kreuzberg",  cityId: "city-berlin",      slug: "kreuzberg",        name: "Kreuzberg",        localityType: "district",    isActive: true },
  { id: "loc-berlin-mitte",      cityId: "city-berlin",      slug: "mitte",            name: "Mitte",            localityType: "district",    isActive: true },
  { id: "loc-dubai-business-bay", cityId: "city-dubai",      slug: "business-bay",     name: "Business Bay",     localityType: "zone",        isActive: true },
  { id: "loc-sp-vila-mariana",   cityId: "city-sao-paulo",   slug: "vila-mariana",     name: "Vila Mariana",     localityType: "district",    isActive: true },
  { id: "loc-mumbai-bandra",     cityId: "city-mumbai",      slug: "bandra-west",      name: "Bandra West",      localityType: "locality",    isActive: true }
];

// ─── Services ─────────────────────────────────────────────────────────────────

/** @type {Service[]} */
export const SERVICES = [
  { id: "svc-barber",         slug: "barber",         name: "Barber",         category: "grooming",       isActive: true },
  { id: "svc-hair-color",     slug: "hair-color",     name: "Hair Color",     category: "beauty",         isActive: true },
  { id: "svc-makeup",         slug: "makeup",         name: "Makeup",         category: "beauty",         isActive: true },
  { id: "svc-locksmith",      slug: "locksmith",      name: "Locksmith",      category: "home-services",  isActive: true },
  { id: "svc-restaurant",     slug: "restaurant",     name: "Restaurant",     category: "food-beverage",  isActive: true },
  { id: "svc-gas-station",    slug: "gas-station",    name: "Gas Station",    category: "automotive",     isActive: true },
  { id: "svc-money-exchange", slug: "money-exchange", name: "Money Exchange", category: "financial",      isActive: true }
];

// ─── Specialties ──────────────────────────────────────────────────────────────

/** @type {Specialty[]} */
export const SPECIALTIES = [
  { id: "spec-curly-fade",              serviceId: "svc-barber",    slug: "curly-fade",              name: "Curly Fade",              isActive: true },
  { id: "spec-taper-fade",              serviceId: "svc-barber",    slug: "taper-fade",              name: "Taper Fade",              isActive: true },
  { id: "spec-fade",                    serviceId: "svc-barber",    slug: "fade",                    name: "Fade",                    isActive: true },
  { id: "spec-beard-trim",              serviceId: "svc-barber",    slug: "beard-trim",              name: "Beard Trim",              isActive: true },
  { id: "spec-line-up",                 serviceId: "svc-barber",    slug: "line-up",                 name: "Line-Up",                 isActive: true },
  { id: "spec-kids-cuts",               serviceId: "svc-barber",    slug: "kids-cuts",               name: "Kids Cuts",               isActive: true },
  { id: "spec-razor-shave",             serviceId: "svc-barber",    slug: "razor-shave",             name: "Razor Shave",             isActive: true },
  { id: "spec-design-work",             serviceId: "svc-barber",    slug: "design-work",             name: "Design Work",             isActive: true },
  { id: "spec-house-call-barber",       serviceId: "svc-barber",    slug: "house-call-barber",       name: "House Call Barber",       isActive: true },
  { id: "spec-balayage",                serviceId: "svc-hair-color", slug: "balayage",               name: "Balayage",                isActive: true },
  { id: "spec-color-correction",        serviceId: "svc-hair-color", slug: "color-correction",       name: "Color Correction",        isActive: true },
  { id: "spec-bridal",                  serviceId: "svc-makeup",    slug: "bridal",                  name: "Bridal Makeup",           isActive: true },
  { id: "spec-editorial",               serviceId: "svc-makeup",    slug: "editorial",               name: "Editorial Makeup",        isActive: true },
  { id: "spec-emergency-lockout",       serviceId: "svc-locksmith", slug: "emergency-lockout",       name: "Emergency Lockout",       isActive: true },
  { id: "spec-car-lockout",             serviceId: "svc-locksmith", slug: "car-lockout",             name: "Car Lockout",             isActive: true },
  { id: "spec-residential-lockout",     serviceId: "svc-locksmith", slug: "residential-lockout",     name: "Residential Lockout",     isActive: true },
  { id: "spec-rekey",                   serviceId: "svc-locksmith", slug: "rekey",                   name: "Rekey",                   isActive: true },
  { id: "spec-lock-change",             serviceId: "svc-locksmith", slug: "lock-change",             name: "Lock Change",             isActive: true },
  { id: "spec-smart-lock-install",      serviceId: "svc-locksmith", slug: "smart-lock-install",      name: "Smart Lock Install",      isActive: true },
  { id: "spec-lock-repair",             serviceId: "svc-locksmith", slug: "lock-repair",             name: "Lock Repair",             isActive: true },
  { id: "spec-commercial-locksmith",    serviceId: "svc-locksmith", slug: "commercial-locksmith",    name: "Commercial Locksmith",    isActive: true },
  { id: "spec-ignition-key-programming", serviceId: "svc-locksmith", slug: "ignition-key-programming", name: "Ignition Key Programming", isActive: true },
  { id: "spec-after-hours-locksmith",   serviceId: "svc-locksmith", slug: "after-hours-locksmith",   name: "After-Hours Locksmith",   isActive: true },
  { id: "spec-mobile-locksmith",        serviceId: "svc-locksmith", slug: "mobile-locksmith",        name: "Mobile Locksmith",        isActive: true },
  { id: "spec-key-duplication",         serviceId: "svc-locksmith", slug: "key-duplication",         name: "Key Duplication",         isActive: true }
];
