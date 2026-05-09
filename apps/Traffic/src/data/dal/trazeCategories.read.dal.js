/**
 * Live TRAZE categories DAL.
 *
 * Categories and services are derived only from the canonical public provider
 * index view. No static taxonomy or catalog services are rendered here: a
 * category/service exists on TRAZE only when at least one active, indexable
 * public provider exists for it.
 */

import { getSupabaseClient } from "@/data/connectors/supabase.client";

const PROVIDER_INDEX_VIEW = "public_traze_provider_index_v";

const PROVIDER_INDEX_SELECT = [
  "id",
  "source",
  "service_id",
  "service_slug",
  "service_name",
  "business_type",
  "country_code",
  "city_slug",
  "city_name"
].join(", ");

function logCategoryError(scope, error) {
  console.error(`[trazeCategories.read.dal] ${scope}:`, error?.message ?? error);
}

function toRows(value) {
  return Array.isArray(value) ? value : [];
}

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toKey(value) {
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

function keyToSlug(value) {
  return toKey(value).replace(/_/g, "-");
}

function titleize(value) {
  const text = toText(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";

  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeCountry(value) {
  const countryCode = toText(value).toUpperCase();
  return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null;
}

function normalizeCity(row) {
  const countryCode = normalizeCountry(row?.country_code);
  const citySlug = keyToSlug(row?.city_slug || row?.city_name);
  if (!countryCode || !citySlug) return null;
  return `${countryCode}:${citySlug}`;
}

function normalizeProviderIndexRow(row) {
  const id = toText(row?.id);
  const source = toText(row?.source);
  if (!id || !["vport", "seed"].includes(source)) return null;

  const serviceIdentity = toText(row?.service_id) ||
    keyToSlug(row?.service_slug || row?.business_type || row?.service_name);
  const serviceKey = keyToSlug(
    row?.service_slug ||
    row?.business_type ||
    row?.service_name ||
    row?.service_id
  );
  if (!serviceIdentity || !serviceKey) return null;

  const categoryKey = keyToSlug(row?.business_type || row?.service_slug || serviceKey);
  const serviceName = toText(row?.service_name) || titleize(serviceKey);
  const categoryName =
    categoryKey === serviceKey
      ? serviceName
      : titleize(row?.business_type || categoryKey);

  return {
    id,
    service_identity: serviceIdentity,
    service_key: serviceKey,
    service_name: serviceName,
    category_key: categoryKey,
    category_name: categoryName,
    country_code: normalizeCountry(row?.country_code),
    city_key: normalizeCity(row)
  };
}

function aggregateLiveCategories(rows) {
  const buckets = new Map();

  for (const row of rows) {
    const normalized = normalizeProviderIndexRow(row);
    if (!normalized) continue;

    const bucketKey = `${normalized.category_key}:${normalized.service_identity}`;
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        service_key: normalized.service_key,
        service_name: normalized.service_name,
        category_key: normalized.category_key,
        category_name: normalized.category_name,
        provider_ids: new Set(),
        country_codes: new Set(),
        city_keys: new Set()
      });
    }

    const bucket = buckets.get(bucketKey);
    bucket.provider_ids.add(normalized.id);
    if (normalized.country_code) bucket.country_codes.add(normalized.country_code);
    if (normalized.city_key) bucket.city_keys.add(normalized.city_key);
  }

  return [...buckets.values()]
    .map((bucket) => ({
      service_key: bucket.service_key,
      service_name: bucket.service_name,
      category_key: bucket.category_key,
      category_name: bucket.category_name,
      provider_count: bucket.provider_ids.size,
      country_count: bucket.country_codes.size,
      city_count: bucket.city_keys.size
    }))
    .filter((row) => row.provider_count > 0)
    .sort((left, right) => {
      if (left.provider_count !== right.provider_count) {
        return right.provider_count - left.provider_count;
      }
      return left.service_name.localeCompare(right.service_name);
    });
}

export async function readLiveTrazeCategories(options = {}) {
  return readLiveTrazeCategoriesForCountry(options);
}

export async function readLiveTrazeCategoriesForCountry(options = {}) {
  const client = getSupabaseClient();
  if (!client) return null;

  let query = client
    .schema("vport")
    .from(PROVIDER_INDEX_VIEW)
    .select(PROVIDER_INDEX_SELECT)
    .eq("is_active", true)
    .eq("is_indexable", true)
    .in("source", ["vport", "seed"]);

  const countryCode = normalizeCountry(options.countryCode);
  if (countryCode) {
    query = query.eq("country_code", countryCode);
  }

  const { data, error } = await query;

  if (error) {
    logCategoryError(PROVIDER_INDEX_VIEW, error);
    return null;
  }

  return aggregateLiveCategories(toRows(data));
}

function rowsForCategory(rows, categoryKey) {
  const key = keyToSlug(categoryKey);
  return rows.filter((row) => row.category_key === key || row.service_key === key);
}

function toLegacyCategoryRow(row) {
  return {
    category_key: row.category_key,
    category_label: row.category_name,
    category_description: null,
    category_label_es: null,
    category_description_es: null,
    service_key: row.service_key,
    service_label: row.service_name,
    service_description: null,
    service_label_es: null,
    service_description_es: null,
    service_group: row.category_key,
    is_active: true,
    provider_count: row.provider_count,
    indexed_provider_count: row.provider_count,
    country_count: row.country_count,
    city_count: row.city_count,
    is_live: row.provider_count > 0,
    sort_order: 999,
    service_sort_order: 999
  };
}

export async function readTrazeCategories(options = {}) {
  const rows = await readLiveTrazeCategoriesForCountry(options);
  return rows ? rows.map(toLegacyCategoryRow) : null;
}

export async function readTrazeCategoryBySlugOrKey(categoryKey, options = {}) {
  if (!categoryKey) return [];

  const rows = await readLiveTrazeCategoriesForCountry(options);
  if (!rows) return null;

  return rowsForCategory(rows, categoryKey).map(toLegacyCategoryRow);
}

export async function readTrazeCategoryByKey(categoryKey, options = {}) {
  return readTrazeCategoryBySlugOrKey(categoryKey, options);
}

export async function readTrazeServicesByCategory(categoryKey, options = {}) {
  return readTrazeCategoryBySlugOrKey(categoryKey, options);
}
