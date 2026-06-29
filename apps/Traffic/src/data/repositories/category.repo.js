/**
 * TRAZE category repository.
 *
 * VCSM/VPort is the source of truth. Traze reads public VPort views and groups
 * them into category objects for discovery pages. Production never falls back
 * to static taxonomy data.
 */

import {
  readLiveTrazeCategories,
  readTrazeCategories,
  readTrazeCategoryBySlugOrKey as readTrazeCategoryRowsBySlugOrKey,
  readTrazeServicesByCategory
} from "@/data/dal/trazeCategories.read.dal";
import { SERVICES } from "@/data/connectors/taxonomyDataset";
import { SERVICE_KEY_ALIASES, getServiceBySlug } from "@/data/repositories/service.repo";

const SERVICE_SLUG_TO_ES = new Map(SERVICES.map((s) => [s.slug, s.nameEs]));

function lookupNameEs(key) {
  const k = String(key ?? "").trim().toLowerCase();
  const direct = SERVICE_SLUG_TO_ES.get(k);
  if (direct) return direct;
  const aliased = SERVICE_KEY_ALIASES[k];
  return aliased ? (SERVICE_SLUG_TO_ES.get(aliased) ?? null) : null;
}

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeKey(value) {
  return toText(value).toLowerCase();
}

// Collapse provider-data category aliases onto their canonical taxonomy slug so
// inconsistent business_type values don't surface as duplicate category cards
// (e.g. "barber" + "barbershop" -> one "Barber" card; "exchange" -> "money-exchange";
// "gas" -> "gas-station"). Keys without an alias are returned hyphen-normalized.
function canonicalCategoryKey(categoryKey) {
  const norm = normalizeKey(categoryKey).replace(/_/g, "-");
  return SERVICE_KEY_ALIASES[norm] ?? norm;
}

function vportKeyFromSlug(value) {
  return toText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function createUnavailableError(source) {
  return new Error(
    `[TRAZE] Real VPort category source unavailable: ${source}. ` +
      `Expected VPort public view: public_traze_provider_index_v. ` +
      `Static taxonomy fallback is disabled.`
  );
}

function handleUnavailable(source) {
  const error = createUnavailableError(source);
  // output: "export" has no runtime server — build time IS production.
  // Throwing here prevents static page generation. Warn and return empty.
  console.warn(error.message);
  return [];
}

function normalizeService(row) {
  const serviceKey = toText(row?.service_key);
  if (!serviceKey) return null;

  return {
    serviceKey,
    serviceLabel: toText(row.service_label) || serviceKey,
    serviceLabelEs: row.service_label_es ?? lookupNameEs(serviceKey) ?? null,
    serviceDescription: row.service_description ?? null,
    serviceDescriptionEs: row.service_description_es ?? null,
    serviceGroup: row.service_group ?? null,
    providerCount: toNumber(row.indexed_provider_count ?? row.provider_count),
    countryCount: toNumber(row.country_count),
    cityCount: toNumber(row.city_count),
    sortOrder: toNumber(row.service_sort_order ?? row.sort_order, 999)
  };
}

function createCategory(row, canonicalKey = null) {
  const categoryKey = canonicalKey || toText(row?.category_key);
  const providerCount = toNumber(row?.provider_count);
  // Prefer the canonical taxonomy label so a collapsed bucket reads "Barber"
  // regardless of which alias row (barber / barbershop) created it.
  const taxonomyService = getServiceBySlug(categoryKey);

  return {
    categoryKey,
    categoryLabel: taxonomyService?.name || toText(row?.category_label) || categoryKey,
    categoryLabelEs: taxonomyService?.nameEs ?? row?.category_label_es ?? lookupNameEs(categoryKey) ?? null,
    categoryDescription: row?.category_description ?? null,
    categoryDescriptionEs: row?.category_description_es ?? null,
    services: [],
    providerCount,
    indexedProviderCount: toNumber(row?.indexed_provider_count),
    countryCount: toNumber(row?.country_count),
    cityCount: toNumber(row?.city_count),
    isLive: providerCount > 0 || row?.is_live === true,
    sortOrder: toNumber(row?.sort_order, 999),
    isFallback: false
  };
}

function groupCategoryRows(rows) {
  const categories = new Map();

  for (const row of rows ?? []) {
    const categoryKey = toText(row?.category_key);
    if (!categoryKey) continue;

    // Group by the canonical key so aliased duplicates merge into one card.
    const lookupKey = canonicalCategoryKey(categoryKey);
    if (!categories.has(lookupKey)) {
      categories.set(lookupKey, createCategory(row, lookupKey));
    }

    const category = categories.get(lookupKey);
    const service = normalizeService(row);
    if (!service) continue;

    if (!category.services.some((item) => item.serviceKey === service.serviceKey)) {
      category.services.push(service);
    }
  }

  return [...categories.values()]
    .map((category) => ({
      ...category,
      providerCount: category.services.reduce(
        (sum, service) => sum + toNumber(service.providerCount),
        0
      ) || category.providerCount,
      indexedProviderCount: category.services.reduce(
        (sum, service) => sum + toNumber(service.providerCount),
        0
      ),
      countryCount: Math.max(
        category.countryCount,
        ...category.services.map((service) => toNumber(service.countryCount))
      ),
      cityCount: Math.max(
        category.cityCount,
        ...category.services.map((service) => toNumber(service.cityCount))
      ),
      services: category.services.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.serviceLabel.localeCompare(b.serviceLabel);
      })
    }))
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.categoryLabel.localeCompare(b.categoryLabel);
    });
}

function findCategory(categories, categoryKey) {
  const raw = normalizeKey(categoryKey);
  const vportKey = vportKeyFromSlug(categoryKey);

  return (
    categories.find((category) => {
      const key = normalizeKey(category.categoryKey);
      return key === raw || key === vportKey;
    }) ?? null
  );
}

/**
 * Final Traze category object:
 * {
 *   categoryKey,
 *   categoryLabel,
 *   categoryDescription,
 *   services: [{ serviceKey, serviceLabel, serviceDescription, serviceGroup, providerCount, sortOrder }],
 *   providerCount,
 *   isLive
 * }
 */
export async function listTrazeCategories(options = {}) {
  const rows = await readTrazeCategories(options);
  if (rows === null) {
    return handleUnavailable("readTrazeCategories returned null");
  }

  return groupCategoryRows(rows);
}

export async function listLiveTrazeCategoryCounts(options = {}) {
  const rows = await readLiveTrazeCategories(options);
  if (rows === null) {
    return handleUnavailable("readLiveTrazeCategories returned null");
  }
  return rows;
}

export async function readTrazeCategoryBySlugOrKeyRepository(categoryKey, options = {}) {
  if (!categoryKey) return null;

  const rows = await readTrazeCategoryRowsBySlugOrKey(categoryKey, options);
  if (rows === null) {
    handleUnavailable(`readTrazeCategoryBySlugOrKey("${categoryKey}") returned null`);
    return null;
  }

  const grouped = groupCategoryRows(rows);
  return grouped[0] ?? null;
}

export async function getTrazeCategoryByKey(categoryKey, options = {}) {
  return readTrazeCategoryBySlugOrKeyRepository(categoryKey, options);
}

export async function readTrazeCategoryBySlugOrKey(categoryKey, options = {}) {
  return readTrazeCategoryBySlugOrKeyRepository(categoryKey, options);
}

export async function readTrazeServicesByCategoryKey(categoryKey, options = {}) {
  if (!categoryKey) return [];

  const services = await readTrazeServicesByCategory(categoryKey, options);
  if (services === null) {
    handleUnavailable(`readTrazeServicesByCategory("${categoryKey}") returned null`);
    return [];
  }

  return services
    .map(normalizeService)
    .filter(Boolean)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.serviceLabel.localeCompare(b.serviceLabel);
    });
}

export async function isCategoryLive(categoryKey) {
  if (!categoryKey) return false;

  const category = await getTrazeCategoryByKey(categoryKey);
  if (!category) return false;

  return category.isLive === true;
}

export async function listLiveTrazeCategories(options = {}) {
  const all = await listTrazeCategories(options);
  return all.filter((category) => category.isLive === true);
}

export async function listInactiveTrazeCategories(options = {}) {
  const all = await listTrazeCategories(options);
  return all.filter((category) => category.isLive !== true);
}

export function selectCategoryBySlugOrKey(categories, categoryKey) {
  return findCategory(categories, categoryKey);
}
