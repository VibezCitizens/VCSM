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
 *
 * Target markets: United States, Mexico, Central America (GT, BZ, HN, SV, NI, CR, PA).
 * All other markets are kept as isActive: false for FK compatibility.
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
  // ── Active markets ──────────────────────────────────────────────────────────
  {
    id: "country-us",
    code: "US",
    slug: "us",
    name: "United States",
    nameEs: "Estados Unidos",
    defaultLocale: "en-US",
    defaultCurrencyCode: "USD",
    isActive: true
  },
  {
    id: "country-mx",
    code: "MX",
    slug: "mexico",
    name: "Mexico",
    nameEs: "México",
    defaultLocale: "es-MX",
    defaultCurrencyCode: "MXN",
    isActive: true
  },
  {
    id: "country-gt",
    code: "GT",
    slug: "gt",
    name: "Guatemala",
    nameEs: "Guatemala",
    defaultLocale: "es-GT",
    defaultCurrencyCode: "GTQ",
    isActive: true
  },
  {
    id: "country-bz",
    code: "BZ",
    slug: "bz",
    name: "Belize",
    nameEs: "Belize",
    defaultLocale: "en-BZ",
    defaultCurrencyCode: "BZD",
    isActive: true
  },
  {
    id: "country-hn",
    code: "HN",
    slug: "hn",
    name: "Honduras",
    nameEs: "Honduras",
    defaultLocale: "es-HN",
    defaultCurrencyCode: "HNL",
    isActive: true
  },
  {
    id: "country-sv",
    code: "SV",
    slug: "sv",
    name: "El Salvador",
    nameEs: "El Salvador",
    defaultLocale: "es-SV",
    defaultCurrencyCode: "USD",
    isActive: true
  },
  {
    id: "country-ni",
    code: "NI",
    slug: "ni",
    name: "Nicaragua",
    nameEs: "Nicaragua",
    defaultLocale: "es-NI",
    defaultCurrencyCode: "NIO",
    isActive: true
  },
  {
    id: "country-cr",
    code: "CR",
    slug: "cr",
    name: "Costa Rica",
    nameEs: "Costa Rica",
    defaultLocale: "es-CR",
    defaultCurrencyCode: "CRC",
    isActive: true
  },
  {
    id: "country-pa",
    code: "PA",
    slug: "pa",
    name: "Panama",
    nameEs: "Panamá",
    defaultLocale: "es-PA",
    defaultCurrencyCode: "USD",
    isActive: true
  },

  // ── Inactive markets (kept for FK compatibility) ─────────────────────────────
  {
    id: "country-ca",
    code: "CA",
    slug: "canada",
    name: "Canada",
    nameEs: "Canadá",
    defaultLocale: "en-CA",
    defaultCurrencyCode: "CAD",
    isActive: false
  },
  {
    id: "country-gb",
    code: "GB",
    slug: "uk",
    name: "United Kingdom",
    nameEs: "Reino Unido",
    defaultLocale: "en-GB",
    defaultCurrencyCode: "GBP",
    isActive: false
  },
  {
    id: "country-es",
    code: "ES",
    slug: "spain",
    name: "Spain",
    nameEs: "España",
    defaultLocale: "es-ES",
    defaultCurrencyCode: "EUR",
    isActive: false
  },
  {
    id: "country-fr",
    code: "FR",
    slug: "france",
    name: "France",
    nameEs: "Francia",
    defaultLocale: "fr-FR",
    defaultCurrencyCode: "EUR",
    isActive: false
  },
  {
    id: "country-de",
    code: "DE",
    slug: "germany",
    name: "Germany",
    nameEs: "Alemania",
    defaultLocale: "de-DE",
    defaultCurrencyCode: "EUR",
    isActive: false
  },
  {
    id: "country-ae",
    code: "AE",
    slug: "uae",
    name: "United Arab Emirates",
    nameEs: "Emiratos Árabes Unidos",
    defaultLocale: "en-AE",
    defaultCurrencyCode: "AED",
    isActive: false
  },
  {
    id: "country-br",
    code: "BR",
    slug: "brazil",
    name: "Brazil",
    nameEs: "Brasil",
    defaultLocale: "pt-BR",
    defaultCurrencyCode: "BRL",
    isActive: false
  },
  {
    id: "country-in",
    code: "IN",
    slug: "india",
    name: "India",
    nameEs: "India",
    defaultLocale: "en-IN",
    defaultCurrencyCode: "INR",
    isActive: false
  }
];

// ─── Regions ──────────────────────────────────────────────────────────────────

/** @type {Region[]} */
export const REGIONS = [
  // ── US states (active) ──────────────────────────────────────────────────────
  { id: "region-us-ca",   countryId: "country-us", code: "CA",   slug: "california",        name: "California",            type: "state",      isActive: true },
  { id: "region-us-fl",   countryId: "country-us", code: "FL",   slug: "florida",            name: "Florida",               type: "state",      isActive: true },
  { id: "region-us-tx",   countryId: "country-us", code: "TX",   slug: "texas",              name: "Texas",                 type: "state",      isActive: true },
  { id: "region-us-ny",   countryId: "country-us", code: "NY",   slug: "new-york",           name: "New York",              type: "state",      isActive: true },
  { id: "region-us-az",   countryId: "country-us", code: "AZ",   slug: "arizona",            name: "Arizona",               type: "state",      isActive: true },
  { id: "region-us-nm",   countryId: "country-us", code: "NM",   slug: "new-mexico",         name: "New Mexico",            type: "state",      isActive: true },
  { id: "region-us-nv",   countryId: "country-us", code: "NV",   slug: "nevada",             name: "Nevada",                type: "state",      isActive: true },
  { id: "region-us-il",   countryId: "country-us", code: "IL",   slug: "illinois",           name: "Illinois",              type: "state",      isActive: true },
  { id: "region-us-wa",   countryId: "country-us", code: "WA",   slug: "washington",         name: "Washington",            type: "state",      isActive: true },
  { id: "region-us-co",   countryId: "country-us", code: "CO",   slug: "colorado",           name: "Colorado",              type: "state",      isActive: true },

  // ── Mexico states (active) ──────────────────────────────────────────────────
  { id: "region-mx-cdmx", countryId: "country-mx", code: "CDMX", slug: "ciudad-de-mexico",   name: "Ciudad de México",      type: "state",      isActive: true },
  { id: "region-mx-nl",   countryId: "country-mx", code: "NL",   slug: "nuevo-leon",         name: "Nuevo León",            type: "state",      isActive: true },
  { id: "region-mx-bc",   countryId: "country-mx", code: "BC",   slug: "baja-california",    name: "Baja California",       type: "state",      isActive: true },
  { id: "region-mx-jal",  countryId: "country-mx", code: "JAL",  slug: "jalisco",            name: "Jalisco",               type: "state",      isActive: true },
  { id: "region-mx-qr",   countryId: "country-mx", code: "QR",   slug: "quintana-roo",       name: "Quintana Roo",          type: "state",      isActive: true },
  { id: "region-mx-chi",  countryId: "country-mx", code: "CHI",  slug: "chihuahua",          name: "Chihuahua",             type: "state",      isActive: true },
  { id: "region-mx-tam",  countryId: "country-mx", code: "TAM",  slug: "tamaulipas",         name: "Tamaulipas",            type: "state",      isActive: true },
  { id: "region-mx-son",  countryId: "country-mx", code: "SON",  slug: "sonora",             name: "Sonora",                type: "state",      isActive: true },
  { id: "region-mx-pue",  countryId: "country-mx", code: "PUE",  slug: "puebla",             name: "Puebla",                type: "state",      isActive: true },

  // ── Central America (active) ─────────────────────────────────────────────────
  { id: "region-gt-gt",   countryId: "country-gt", code: "GT",   slug: "guatemala",          name: "Guatemala",             type: "department", isActive: true },
  { id: "region-bz-bz",   countryId: "country-bz", code: "BZ",   slug: "belize-district",    name: "Belize District",       type: "department", isActive: true },
  { id: "region-hn-fm",   countryId: "country-hn", code: "FM",   slug: "francisco-morazan",  name: "Francisco Morazán",     type: "department", isActive: true },
  { id: "region-sv-ss",   countryId: "country-sv", code: "SS",   slug: "san-salvador",       name: "San Salvador",          type: "department", isActive: true },
  { id: "region-ni-mg",   countryId: "country-ni", code: "MG",   slug: "managua",            name: "Managua",               type: "department", isActive: true },
  { id: "region-cr-sj",   countryId: "country-cr", code: "SJ",   slug: "san-jose",           name: "San José",              type: "province",   isActive: true },
  { id: "region-pa-pa",   countryId: "country-pa", code: "PA",   slug: "panama-province",    name: "Panama Province",       type: "province",   isActive: true },

  // ── Inactive regions (kept for FK compatibility) ──────────────────────────────
  { id: "region-ca-on",   countryId: "country-ca", code: "ON",   slug: "ontario",            name: "Ontario",               type: "province",   isActive: false },
  { id: "region-gb-eng",  countryId: "country-gb", code: "ENG",  slug: "england",            name: "England",               type: "county",     isActive: false },
  { id: "region-es-md",   countryId: "country-es", code: "MD",   slug: "madrid",             name: "Comunidad de Madrid",   type: "department", isActive: false },
  { id: "region-fr-idf",  countryId: "country-fr", code: "IDF",  slug: "ile-de-france",      name: "Ile-de-France",         type: "department", isActive: false },
  { id: "region-de-be",   countryId: "country-de", code: "BE",   slug: "berlin",             name: "Berlin",                type: "state",      isActive: false },
  { id: "region-ae-du",   countryId: "country-ae", code: "DU",   slug: "dubai",              name: "Dubai",                 type: "emirate",    isActive: false },
  { id: "region-br-sp",   countryId: "country-br", code: "SP",   slug: "sao-paulo",          name: "Sao Paulo",             type: "state",      isActive: false },
  { id: "region-in-mh",   countryId: "country-in", code: "MH",   slug: "maharashtra",        name: "Maharashtra",           type: "state",      isActive: false }
];

// ─── Cities ───────────────────────────────────────────────────────────────────

/** @type {City[]} */
export const CITIES = [
  // ── US — California ─────────────────────────────────────────────────────────
  {
    id: "city-sf",
    countryId: "country-us",
    regionId: "region-us-ca",
    slug: "san-francisco",
    name: "San Francisco",
    nameEs: "San Francisco",
    stateCode: "CA",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    lat: 37.7749,
    lon: -122.4194,
    isActive: true
  },
  {
    id: "city-los-angeles",
    countryId: "country-us",
    regionId: "region-us-ca",
    slug: "los-angeles",
    name: "Los Angeles",
    nameEs: "Los Ángeles",
    stateCode: "CA",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    lat: 34.0522,
    lon: -118.2437,
    isActive: true
  },
  {
    id: "city-san-diego",
    countryId: "country-us",
    regionId: "region-us-ca",
    slug: "san-diego",
    name: "San Diego",
    nameEs: "San Diego",
    stateCode: "CA",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    lat: 32.7157,
    lon: -117.1611,
    isActive: true
  },

  // ── US — Florida ─────────────────────────────────────────────────────────────
  {
    id: "city-miami",
    countryId: "country-us",
    regionId: "region-us-fl",
    slug: "miami",
    name: "Miami",
    nameEs: "Miami",
    stateCode: "FL",
    countryCode: "US",
    timezone: "America/New_York",
    lat: 25.7617,
    lon: -80.1918,
    isActive: true
  },
  {
    id: "city-orlando",
    countryId: "country-us",
    regionId: "region-us-fl",
    slug: "orlando",
    name: "Orlando",
    nameEs: "Orlando",
    stateCode: "FL",
    countryCode: "US",
    timezone: "America/New_York",
    lat: 28.5383,
    lon: -81.3792,
    isActive: true
  },
  {
    id: "city-tampa",
    countryId: "country-us",
    regionId: "region-us-fl",
    slug: "tampa",
    name: "Tampa",
    nameEs: "Tampa",
    stateCode: "FL",
    countryCode: "US",
    timezone: "America/New_York",
    lat: 27.9506,
    lon: -82.4572,
    isActive: true
  },

  // ── US — Texas ───────────────────────────────────────────────────────────────
  {
    id: "city-houston",
    countryId: "country-us",
    regionId: "region-us-tx",
    slug: "houston",
    name: "Houston",
    nameEs: "Houston",
    stateCode: "TX",
    countryCode: "US",
    timezone: "America/Chicago",
    lat: 29.7604,
    lon: -95.3698,
    isActive: true
  },
  {
    id: "city-san-antonio",
    countryId: "country-us",
    regionId: "region-us-tx",
    slug: "san-antonio",
    name: "San Antonio",
    nameEs: "San Antonio",
    stateCode: "TX",
    countryCode: "US",
    timezone: "America/Chicago",
    lat: 29.4241,
    lon: -98.4936,
    isActive: true
  },
  {
    id: "city-dallas",
    countryId: "country-us",
    regionId: "region-us-tx",
    slug: "dallas",
    name: "Dallas",
    nameEs: "Dallas",
    stateCode: "TX",
    countryCode: "US",
    timezone: "America/Chicago",
    lat: 32.7767,
    lon: -96.7970,
    isActive: true
  },
  {
    id: "city-el-paso",
    countryId: "country-us",
    regionId: "region-us-tx",
    slug: "el-paso",
    name: "El Paso",
    nameEs: "El Paso",
    stateCode: "TX",
    countryCode: "US",
    timezone: "America/Denver",
    lat: 31.7619,
    lon: -106.4850,
    isActive: true
  },
  {
    id: "city-mcallen",
    countryId: "country-us",
    regionId: "region-us-tx",
    slug: "mcallen",
    name: "McAllen",
    nameEs: "McAllen",
    stateCode: "TX",
    countryCode: "US",
    timezone: "America/Chicago",
    lat: 26.2034,
    lon: -98.2300,
    isActive: true
  },
  {
    id: "city-brownsville",
    countryId: "country-us",
    regionId: "region-us-tx",
    slug: "brownsville",
    name: "Brownsville",
    nameEs: "Brownsville",
    stateCode: "TX",
    countryCode: "US",
    timezone: "America/Chicago",
    lat: 25.9017,
    lon: -97.4975,
    isActive: true
  },
  {
    id: "city-laredo",
    countryId: "country-us",
    regionId: "region-us-tx",
    slug: "laredo",
    name: "Laredo",
    nameEs: "Laredo",
    stateCode: "TX",
    countryCode: "US",
    timezone: "America/Chicago",
    lat: 27.5306,
    lon: -99.4803,
    isActive: true
  },

  // ── US — Other states ────────────────────────────────────────────────────────
  {
    id: "city-phoenix",
    countryId: "country-us",
    regionId: "region-us-az",
    slug: "phoenix",
    name: "Phoenix",
    nameEs: "Phoenix",
    stateCode: "AZ",
    countryCode: "US",
    timezone: "America/Phoenix",
    lat: 33.4484,
    lon: -112.0740,
    isActive: true
  },
  {
    id: "city-las-vegas",
    countryId: "country-us",
    regionId: "region-us-nv",
    slug: "las-vegas",
    name: "Las Vegas",
    nameEs: "Las Vegas",
    stateCode: "NV",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    lat: 36.1699,
    lon: -115.1398,
    isActive: true
  },
  {
    id: "city-new-york",
    countryId: "country-us",
    regionId: "region-us-ny",
    slug: "new-york",
    name: "New York",
    nameEs: "Nueva York",
    stateCode: "NY",
    countryCode: "US",
    timezone: "America/New_York",
    lat: 40.7128,
    lon: -74.0060,
    isActive: true
  },
  {
    id: "city-chicago",
    countryId: "country-us",
    regionId: "region-us-il",
    slug: "chicago",
    name: "Chicago",
    nameEs: "Chicago",
    stateCode: "IL",
    countryCode: "US",
    timezone: "America/Chicago",
    lat: 41.8781,
    lon: -87.6298,
    isActive: true
  },

  // ── Mexico ───────────────────────────────────────────────────────────────────
  {
    id: "city-mexico-city",
    countryId: "country-mx",
    regionId: "region-mx-cdmx",
    slug: "mexico-city",
    name: "Mexico City",
    nameEs: "Ciudad de México",
    stateCode: "CDMX",
    countryCode: "MX",
    timezone: "America/Mexico_City",
    lat: 19.4326,
    lon: -99.1332,
    isActive: true
  },
  {
    id: "city-monterrey",
    countryId: "country-mx",
    regionId: "region-mx-nl",
    slug: "monterrey",
    name: "Monterrey",
    nameEs: "Monterrey",
    stateCode: "NL",
    countryCode: "MX",
    timezone: "America/Monterrey",
    lat: 25.6866,
    lon: -100.3161,
    isActive: true
  },
  {
    id: "city-tijuana",
    countryId: "country-mx",
    regionId: "region-mx-bc",
    slug: "tijuana",
    name: "Tijuana",
    nameEs: "Tijuana",
    stateCode: "BC",
    countryCode: "MX",
    timezone: "America/Tijuana",
    lat: 32.5149,
    lon: -117.0382,
    isActive: true
  },
  {
    id: "city-ciudad-juarez",
    countryId: "country-mx",
    regionId: "region-mx-chi",
    slug: "ciudad-juarez",
    name: "Ciudad Juárez",
    nameEs: "Ciudad Juárez",
    stateCode: "CHI",
    countryCode: "MX",
    timezone: "America/Ojinaga",
    lat: 31.6904,
    lon: -106.4245,
    isActive: true
  },
  {
    id: "city-guadalajara",
    countryId: "country-mx",
    regionId: "region-mx-jal",
    slug: "guadalajara",
    name: "Guadalajara",
    nameEs: "Guadalajara",
    stateCode: "JAL",
    countryCode: "MX",
    timezone: "America/Mexico_City",
    lat: 20.6597,
    lon: -103.3496,
    isActive: true
  },
  {
    id: "city-cancun",
    countryId: "country-mx",
    regionId: "region-mx-qr",
    slug: "cancun",
    name: "Cancún",
    nameEs: "Cancún",
    stateCode: "QR",
    countryCode: "MX",
    timezone: "America/Cancun",
    lat: 21.1619,
    lon: -86.8515,
    isActive: true
  },
  {
    id: "city-puebla",
    countryId: "country-mx",
    regionId: "region-mx-pue",
    slug: "puebla",
    name: "Puebla",
    nameEs: "Puebla",
    stateCode: "PUE",
    countryCode: "MX",
    timezone: "America/Mexico_City",
    lat: 19.0414,
    lon: -98.2063,
    isActive: true
  },
  {
    id: "city-mexicali",
    countryId: "country-mx",
    regionId: "region-mx-bc",
    slug: "mexicali",
    name: "Mexicali",
    nameEs: "Mexicali",
    stateCode: "BC",
    countryCode: "MX",
    timezone: "America/Tijuana",
    lat: 32.6245,
    lon: -115.4523,
    isActive: true
  },
  {
    id: "city-matamoros",
    countryId: "country-mx",
    regionId: "region-mx-tam",
    slug: "matamoros",
    name: "Matamoros",
    nameEs: "Matamoros",
    stateCode: "TAM",
    countryCode: "MX",
    timezone: "America/Matamoros",
    lat: 25.8691,
    lon: -97.5026,
    isActive: true
  },
  {
    id: "city-reynosa",
    countryId: "country-mx",
    regionId: "region-mx-tam",
    slug: "reynosa",
    name: "Reynosa",
    nameEs: "Reynosa",
    stateCode: "TAM",
    countryCode: "MX",
    timezone: "America/Matamoros",
    lat: 26.0921,
    lon: -98.2771,
    isActive: true
  },
  {
    id: "city-nuevo-laredo",
    countryId: "country-mx",
    regionId: "region-mx-tam",
    slug: "nuevo-laredo",
    name: "Nuevo Laredo",
    nameEs: "Nuevo Laredo",
    stateCode: "TAM",
    countryCode: "MX",
    timezone: "America/Matamoros",
    lat: 27.4767,
    lon: -99.5155,
    isActive: true
  },
  {
    id: "city-hermosillo",
    countryId: "country-mx",
    regionId: "region-mx-son",
    slug: "hermosillo",
    name: "Hermosillo",
    nameEs: "Hermosillo",
    stateCode: "SON",
    countryCode: "MX",
    timezone: "America/Hermosillo",
    lat: 29.0729,
    lon: -110.9559,
    isActive: true
  },

  // ── Central America ───────────────────────────────────────────────────────────
  {
    id: "city-guatemala-city",
    countryId: "country-gt",
    regionId: "region-gt-gt",
    slug: "guatemala-city",
    name: "Guatemala City",
    nameEs: "Ciudad de Guatemala",
    stateCode: "GT",
    countryCode: "GT",
    timezone: "America/Guatemala",
    lat: 14.6349,
    lon: -90.5069,
    isActive: true
  },
  {
    id: "city-belize-city",
    countryId: "country-bz",
    regionId: "region-bz-bz",
    slug: "belize-city",
    name: "Belize City",
    nameEs: "Ciudad de Belice",
    stateCode: "BZ",
    countryCode: "BZ",
    timezone: "America/Belize",
    lat: 17.2510,
    lon: -88.7590,
    isActive: true
  },
  {
    id: "city-tegucigalpa",
    countryId: "country-hn",
    regionId: "region-hn-fm",
    slug: "tegucigalpa",
    name: "Tegucigalpa",
    nameEs: "Tegucigalpa",
    stateCode: "FM",
    countryCode: "HN",
    timezone: "America/Tegucigalpa",
    lat: 14.0723,
    lon: -87.1921,
    isActive: true
  },
  {
    id: "city-san-salvador",
    countryId: "country-sv",
    regionId: "region-sv-ss",
    slug: "san-salvador",
    name: "San Salvador",
    nameEs: "San Salvador",
    stateCode: "SS",
    countryCode: "SV",
    timezone: "America/El_Salvador",
    lat: 13.6929,
    lon: -89.2182,
    isActive: true
  },
  {
    id: "city-managua",
    countryId: "country-ni",
    regionId: "region-ni-mg",
    slug: "managua",
    name: "Managua",
    nameEs: "Managua",
    stateCode: "MG",
    countryCode: "NI",
    timezone: "America/Managua",
    lat: 12.1364,
    lon: -86.2779,
    isActive: true
  },
  {
    id: "city-san-jose-cr",
    countryId: "country-cr",
    regionId: "region-cr-sj",
    slug: "san-jose",
    name: "San José",
    nameEs: "San José",
    stateCode: "SJ",
    countryCode: "CR",
    timezone: "America/Costa_Rica",
    lat: 9.9281,
    lon: -84.0907,
    isActive: true
  },
  {
    id: "city-panama-city",
    countryId: "country-pa",
    regionId: "region-pa-pa",
    slug: "panama-city",
    name: "Panama City",
    nameEs: "Ciudad de Panamá",
    stateCode: "PA",
    countryCode: "PA",
    timezone: "America/Panama",
    lat: 8.9936,
    lon: -79.5197,
    isActive: true
  },

  // ── Inactive cities (kept for FK compatibility) ────────────────────────────────
  {
    id: "city-toronto",
    countryId: "country-ca",
    regionId: "region-ca-on",
    slug: "toronto",
    name: "Toronto",
    stateCode: null,
    countryCode: "CA",
    timezone: "America/Toronto",
    lat: 43.6532,
    lon: -79.3832,
    isActive: false
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
    lat: 51.5074,
    lon: -0.1278,
    isActive: false
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
    lat: 40.4168,
    lon: -3.7038,
    isActive: false
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
    lat: 48.8566,
    lon: 2.3522,
    isActive: false
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
    lat: 52.5200,
    lon: 13.4050,
    isActive: false
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
    lat: 25.2048,
    lon: 55.2708,
    isActive: false
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
    lat: -23.5505,
    lon: -46.6333,
    isActive: false
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
    lat: 19.0760,
    lon: 72.8777,
    isActive: false
  }
];

// ─── Neighborhoods / Localities ───────────────────────────────────────────────

/** @type {Neighborhood[]} */
export const NEIGHBORHOODS = [
  // ── San Francisco ────────────────────────────────────────────────────────────
  { id: "loc-sf-mission",          cityId: "city-sf",             slug: "mission-district",  name: "Mission District",   localityType: "district",     isActive: true },
  { id: "loc-sf-soma",             cityId: "city-sf",             slug: "soma",              name: "SoMa",               localityType: "district",     isActive: true },

  // ── Miami ─────────────────────────────────────────────────────────────────────
  { id: "loc-miami-brickell",      cityId: "city-miami",          slug: "brickell",          name: "Brickell",           localityType: "neighborhood", isActive: true },
  { id: "loc-miami-wynwood",       cityId: "city-miami",          slug: "wynwood",           name: "Wynwood",            localityType: "neighborhood", isActive: true },
  { id: "loc-miami-little-havana", cityId: "city-miami",          slug: "little-havana",     name: "Little Havana",      localityType: "neighborhood", isActive: true },

  // ── Mexico City ───────────────────────────────────────────────────────────────
  { id: "loc-mx-roma",             cityId: "city-mexico-city",    slug: "roma-norte",        name: "Roma Norte",         localityType: "district",     isActive: true },
  { id: "loc-mx-zona-rosa",        cityId: "city-mexico-city",    slug: "zona-rosa",         name: "Zona Rosa",          localityType: "district",     isActive: true },
  { id: "loc-mx-polanco",          cityId: "city-mexico-city",    slug: "polanco",           name: "Polanco",            localityType: "district",     isActive: true },

  // ── Monterrey ─────────────────────────────────────────────────────────────────
  { id: "loc-mty-centro",          cityId: "city-monterrey",      slug: "centro",            name: "Centro",             localityType: "district",     isActive: true },
  { id: "loc-mty-san-pedro",       cityId: "city-monterrey",      slug: "san-pedro",         name: "San Pedro Garza García", localityType: "district", isActive: true },

  // ── Guatemala City ────────────────────────────────────────────────────────────
  { id: "loc-gt-zona1",            cityId: "city-guatemala-city", slug: "zona-1",            name: "Zona 1",             localityType: "zone",         isActive: true },
  { id: "loc-gt-zona10",           cityId: "city-guatemala-city", slug: "zona-10",           name: "Zona 10",            localityType: "zone",         isActive: true },

  // ── Inactive neighborhoods (kept for FK compatibility) ─────────────────────────
  { id: "loc-toronto-old-town",    cityId: "city-toronto",        slug: "old-town",          name: "Old Town",           localityType: "borough",      isActive: false },
  { id: "loc-london-shoreditch",   cityId: "city-london",         slug: "shoreditch",        name: "Shoreditch",         localityType: "borough",      isActive: false },
  { id: "loc-london-east-end",     cityId: "city-london",         slug: "east-end",          name: "East End",           localityType: "borough",      isActive: false },
  { id: "loc-london-soho",         cityId: "city-london",         slug: "soho",              name: "Soho",               localityType: "district",     isActive: false },
  { id: "loc-madrid-salamanca",    cityId: "city-madrid",         slug: "salamanca",         name: "Salamanca",          localityType: "district",     isActive: false },
  { id: "loc-paris-marais",        cityId: "city-paris",          slug: "le-marais",         name: "Le Marais",          localityType: "district",     isActive: false },
  { id: "loc-berlin-kreuzberg",    cityId: "city-berlin",         slug: "kreuzberg",         name: "Kreuzberg",          localityType: "district",     isActive: false },
  { id: "loc-berlin-mitte",        cityId: "city-berlin",         slug: "mitte",             name: "Mitte",              localityType: "district",     isActive: false },
  { id: "loc-dubai-business-bay",  cityId: "city-dubai",          slug: "business-bay",      name: "Business Bay",       localityType: "zone",         isActive: false },
  { id: "loc-sp-vila-mariana",     cityId: "city-sao-paulo",      slug: "vila-mariana",      name: "Vila Mariana",       localityType: "district",     isActive: false },
  { id: "loc-mumbai-bandra",       cityId: "city-mumbai",         slug: "bandra-west",       name: "Bandra West",        localityType: "locality",     isActive: false }
];

// ─── Services ─────────────────────────────────────────────────────────────────

/** @type {Service[]} */
export const SERVICES = [
  {
    id: "svc-barber",
    slug: "barber",
    name: "Barber",
    nameEs: "Barbería",
    category: "grooming",
    searchTerms: ["barber", "barbershop", "haircut", "fade", "beard"],
    searchTermsEs: ["barbero", "barbería", "corte", "fade", "peluquero"],
    isActive: true
  },
  {
    id: "svc-hair-color",
    slug: "hair-color",
    name: "Hair Color",
    nameEs: "Coloración de Cabello",
    category: "beauty",
    searchTerms: ["hair color", "balayage", "highlights", "tint"],
    searchTermsEs: ["tinte", "coloración", "balayage", "mechas"],
    isActive: true
  },
  {
    id: "svc-makeup",
    slug: "makeup",
    name: "Makeup",
    nameEs: "Maquillaje",
    category: "beauty",
    searchTerms: ["makeup", "makeup artist", "beauty"],
    searchTermsEs: ["maquillaje", "maquilladora", "make up"],
    isActive: true
  },
  {
    id: "svc-locksmith",
    slug: "locksmith",
    name: "Locksmith",
    nameEs: "Cerrajero",
    category: "home-services",
    searchTerms: ["locksmith", "lockout", "key", "lock"],
    searchTermsEs: ["cerrajero", "cerrajería", "llaves", "cerradura"],
    isActive: true
  },
  {
    id: "svc-restaurant",
    slug: "restaurant",
    name: "Restaurant",
    nameEs: "Restaurante",
    category: "food-beverage",
    searchTerms: ["restaurant", "food", "dining", "eat"],
    searchTermsEs: ["restaurante", "comida", "cocina", "chef", "café"],
    isActive: true
  },
  {
    id: "svc-gas-station",
    slug: "gas-station",
    name: "Gas Station",
    nameEs: "Gasolinera",
    category: "automotive",
    searchTerms: ["gas station", "fuel", "petrol"],
    searchTermsEs: ["gasolinera", "combustible", "gasolina", "estación de servicio"],
    isActive: true
  },
  {
    id: "svc-money-exchange",
    slug: "money-exchange",
    name: "Money Exchange",
    nameEs: "Casa de Cambio",
    category: "financial",
    searchTerms: ["money exchange", "currency exchange", "forex"],
    searchTermsEs: ["casa de cambio", "cambio de divisas", "forex", "dólares"],
    isActive: true
  }
];

// ─── Specialties ──────────────────────────────────────────────────────────────

/** @type {Specialty[]} */
export const SPECIALTIES = [
  { id: "spec-curly-fade",               serviceId: "svc-barber",     slug: "curly-fade",               name: "Curly Fade",               isActive: true },
  { id: "spec-taper-fade",               serviceId: "svc-barber",     slug: "taper-fade",               name: "Taper Fade",               isActive: true },
  { id: "spec-fade",                     serviceId: "svc-barber",     slug: "fade",                     name: "Fade",                     isActive: true },
  { id: "spec-beard-trim",               serviceId: "svc-barber",     slug: "beard-trim",               name: "Beard Trim",               isActive: true },
  { id: "spec-line-up",                  serviceId: "svc-barber",     slug: "line-up",                  name: "Line-Up",                  isActive: true },
  { id: "spec-kids-cuts",                serviceId: "svc-barber",     slug: "kids-cuts",                name: "Kids Cuts",                isActive: true },
  { id: "spec-razor-shave",              serviceId: "svc-barber",     slug: "razor-shave",              name: "Razor Shave",              isActive: true },
  { id: "spec-design-work",              serviceId: "svc-barber",     slug: "design-work",              name: "Design Work",              isActive: true },
  { id: "spec-house-call-barber",        serviceId: "svc-barber",     slug: "house-call-barber",        name: "House Call Barber",        isActive: true },
  { id: "spec-balayage",                 serviceId: "svc-hair-color", slug: "balayage",                 name: "Balayage",                 isActive: true },
  { id: "spec-color-correction",         serviceId: "svc-hair-color", slug: "color-correction",         name: "Color Correction",         isActive: true },
  { id: "spec-bridal",                   serviceId: "svc-makeup",     slug: "bridal",                   name: "Bridal Makeup",            isActive: true },
  { id: "spec-editorial",                serviceId: "svc-makeup",     slug: "editorial",                name: "Editorial Makeup",         isActive: true },
  { id: "spec-emergency-lockout",        serviceId: "svc-locksmith",  slug: "emergency-lockout",        name: "Emergency Lockout",        isActive: true },
  { id: "spec-car-lockout",              serviceId: "svc-locksmith",  slug: "car-lockout",              name: "Car Lockout",              isActive: true },
  { id: "spec-residential-lockout",      serviceId: "svc-locksmith",  slug: "residential-lockout",      name: "Residential Lockout",      isActive: true },
  { id: "spec-rekey",                    serviceId: "svc-locksmith",  slug: "rekey",                    name: "Rekey",                    isActive: true },
  { id: "spec-lock-change",              serviceId: "svc-locksmith",  slug: "lock-change",              name: "Lock Change",              isActive: true },
  { id: "spec-smart-lock-install",       serviceId: "svc-locksmith",  slug: "smart-lock-install",       name: "Smart Lock Install",       isActive: true },
  { id: "spec-lock-repair",              serviceId: "svc-locksmith",  slug: "lock-repair",              name: "Lock Repair",              isActive: true },
  { id: "spec-commercial-locksmith",     serviceId: "svc-locksmith",  slug: "commercial-locksmith",     name: "Commercial Locksmith",     isActive: true },
  { id: "spec-ignition-key-programming", serviceId: "svc-locksmith",  slug: "ignition-key-programming", name: "Ignition Key Programming", isActive: true },
  { id: "spec-after-hours-locksmith",    serviceId: "svc-locksmith",  slug: "after-hours-locksmith",    name: "After-Hours Locksmith",    isActive: true },
  { id: "spec-mobile-locksmith",         serviceId: "svc-locksmith",  slug: "mobile-locksmith",         name: "Mobile Locksmith",         isActive: true },
  { id: "spec-key-duplication",          serviceId: "svc-locksmith",  slug: "key-duplication",          name: "Key Duplication",          isActive: true }
];
