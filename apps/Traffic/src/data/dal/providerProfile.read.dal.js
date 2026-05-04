/**
 * Provider profile DAL — fetches live per-provider data from Supabase.
 *
 * All exports are async, never throw, and return empty safe values when
 * Supabase is unavailable or the query fails.
 */

import { getSupabaseClient } from "@/data/connectors/supabase.client";

function devWarn(label, err) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[providerProfile] ${label}:`, err?.message ?? err);
  }
}

function client() {
  return getSupabaseClient();
}

// ─── Services ─────────────────────────────────────────────────────────────────

/**
 * Fetches enabled services for a profile, merged with booking profile data.
 * @param {string} profileId - vport.profiles UUID
 * @returns {Promise<Array>}
 */
export async function fetchProviderServices(profileId) {
  if (!profileId) return [];
  const db = client();
  if (!db) return [];

  try {
    const { data: services, error } = await db
      .schema("vport")
      .from("public_provider_services_v")
      .select(
        "id, key, label, description, service_group, sort_order, " +
        "duration_minutes, is_bookable, price_cents, currency_code, booking_mode"
      )
      .eq("profile_id", profileId)
      .order("sort_order", { ascending: true });

    if (error) { devWarn("public_provider_services_v", error); return []; }
    if (!services?.length) return [];

    return services.map((svc) => {
      const hasBooking = [
        svc.duration_minutes,
        svc.is_bookable,
        svc.price_cents,
        svc.currency_code,
        svc.booking_mode
      ].some((value) => value !== null && value !== undefined);

      return {
        id: svc.id,
        key: svc.key,
        label: svc.label,
        description: svc.description ?? null,
        serviceGroup: svc.service_group ?? null,
        booking: hasBooking
          ? {
              service_id: svc.id,
              duration_minutes: svc.duration_minutes ?? null,
              is_bookable: svc.is_bookable ?? null,
              price_cents: svc.price_cents ?? null,
              currency_code: svc.currency_code ?? null,
              booking_mode: svc.booking_mode ?? null
            }
          : null
      };
    });
  } catch (err) {
    devWarn("fetchProviderServices", err);
    return [];
  }
}

// ─── Public details ───────────────────────────────────────────────────────────

/**
 * Fetches supplemental public contact details for a profile.
 * @param {string} profileId - vport.profiles UUID
 * @returns {Promise<object|null>}
 */
export async function fetchProviderPublicDetails(profileId) {
  if (!profileId) return null;
  const db = client();
  if (!db) return null;

  try {
    const { data, error } = await db
      .schema("vport")
      .from("public_provider_details_v")
      .select("website_url, email_public, phone_public, location_text, address, hours")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) { devWarn("public_provider_details_v", error); return null; }
    return data ?? null;
  } catch (err) {
    devWarn("fetchProviderPublicDetails", err);
    return null;
  }
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

/**
 * Fetches the public menu for a provider, grouped by category.
 * @param {string} profileId - vport.profiles UUID
 * @returns {Promise<Array<{key:string,name:string,items:Array}>>}
 */
export async function fetchProviderMenu(profileId) {
  if (!profileId) return [];
  const db = client();
  if (!db) return [];

  try {
    const { data, error } = await db
      .schema("vport")
      .from("public_menu_read_model_v")
      .select(
        "category_key, category_name, category_sort_order, " +
        "item_key, item_name, item_description, price_cents, currency_code, image_url"
      )
      .eq("profile_id", profileId)
      .order("category_sort_order", { ascending: true });

    if (error) { devWarn("public_menu_read_model_v", error); return []; }
    if (!data?.length) return [];

    const categoryMap = new Map();
    for (const row of data) {
      if (!row.category_key) continue;
      if (!categoryMap.has(row.category_key)) {
        categoryMap.set(row.category_key, {
          key: row.category_key,
          name: row.category_name ?? row.category_key,
          items: []
        });
      }
      if (row.item_key) {
        categoryMap.get(row.category_key).items.push({
          key: row.item_key,
          name: row.item_name ?? row.item_key,
          description: row.item_description ?? null,
          priceCents: row.price_cents ?? null,
          currencyCode: row.currency_code ?? null,
          imageUrl: row.image_url ?? null
        });
      }
    }

    return [...categoryMap.values()];
  } catch (err) {
    devWarn("fetchProviderMenu", err);
    return [];
  }
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

/**
 * Fetches public portfolio media items for a provider.
 * @param {string} profileId - vport.profiles UUID
 * @returns {Promise<Array<{portfolioItemId:string,title:string|null,isFeatured:boolean,mediaUrl:string,mediaRole:string|null,altText:string|null}>>}
 */
export async function fetchProviderPortfolio(profileId) {
  if (!profileId) return [];
  const db = client();
  if (!db) return [];

  try {
    const { data, error } = await db
      .schema("vport")
      .from("public_traze_portfolio_v")
      .select(
        "portfolio_item_id, title, portfolio_kind, is_featured, " +
        "media_url, media_role, alt_text, sort_order"
      )
      .eq("profile_id", profileId)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(9);

    if (error) { devWarn("public_traze_portfolio_v", error); return []; }
    if (!data?.length) return [];

    return data
      .filter((row) => Boolean(row.media_url))
      .map((row) => ({
        portfolioItemId: row.portfolio_item_id,
        title: row.title ?? null,
        portfolioKind: row.portfolio_kind ?? null,
        isFeatured: Boolean(row.is_featured),
        mediaUrl: row.media_url,
        mediaRole: row.media_role ?? null,
        altText: row.alt_text ?? null
      }));
  } catch (err) {
    devWarn("fetchProviderPortfolio", err);
    return [];
  }
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

/**
 * Fetches recent active reviews for a provider actor.
 * @param {string} actorId - vc.actors UUID (provider's actor_id)
 * @param {{ limit?: number }} options
 * @returns {Promise<Array>}
 */
export async function fetchProviderReviews(actorId, { limit = 6 } = {}) {
  if (!actorId) return [];
  const db = client();
  if (!db) return [];

  try {
    const { data, error } = await db
      .schema("reviews")
      .from("public_vport_reviews_v")
      .select(
        "review_id, overall_rating, body, review_activity_at, " +
        "author_display_name_snapshot, author_avatar_url_snapshot, target_subtype"
      )
      .eq("target_actor_id", actorId)
      .order("review_activity_at", { ascending: false })
      .limit(limit);

    if (error) { devWarn("reviews", error); return []; }
    return (data ?? []).map((row) => ({
      ...row,
      id: row.review_id ?? row.id
    }));
  } catch (err) {
    devWarn("fetchProviderReviews", err);
    return [];
  }
}

/**
 * Fetches public review summary for a provider actor.
 * @param {string} actorId - vc.actors UUID (provider's actor_id)
 * @returns {Promise<object|null>}
 */
export async function fetchProviderReviewSummary(actorId) {
  if (!actorId) return null;
  const db = client();
  if (!db) return null;

  try {
    const { data, error } = await db
      .schema("reviews")
      .from("public_vport_review_summary_v")
      .select("target_actor_id,review_count,average_rating,first_review_at,last_review_activity_at")
      .eq("target_actor_id", actorId)
      .maybeSingle();

    if (error) {
      devWarn("public_vport_review_summary_v", error);
      return null;
    }

    return data ?? null;
  } catch (err) {
    devWarn("fetchProviderReviewSummary", err);
    return null;
  }
}

// ─── Review dimension averages ────────────────────────────────────────────────

/**
 * Aggregates dimension rating averages across a set of review IDs.
 * @param {string[]} reviewIds
 * @returns {Promise<Array<{dimensionId: string, label: string, average: number}>>}
 */
export async function fetchReviewDimensionAverages(reviewIds) {
  if (!reviewIds?.length) return [];
  const db = client();
  if (!db) return [];

  try {
    const { data, error } = await db
      .schema("reviews")
      .from("public_vport_review_dimension_ratings_v")
      .select("dimension_id, rating, label_snapshot")
      .in("review_id", reviewIds);

    if (error) { devWarn("public_vport_review_dimension_ratings_v", error); return []; }
    if (!data?.length) return [];

    const byDim = new Map();
    for (const row of data) {
      const entry = byDim.get(row.dimension_id);
      if (entry) {
        entry.total += Number(row.rating);
        entry.count += 1;
      } else {
        byDim.set(row.dimension_id, {
          dimensionId: row.dimension_id,
          label: row.label_snapshot ?? row.dimension_id,
          total: Number(row.rating),
          count: 1
        });
      }
    }

    return [...byDim.values()]
      .map((d) => ({
        dimensionId: d.dimensionId,
        label: d.label,
        average: Math.round((d.total / d.count) * 10) / 10
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (err) {
    devWarn("fetchReviewDimensionAverages", err);
    return [];
  }
}
