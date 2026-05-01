import { supabase } from "@/services/supabase/supabaseClient";
import { vport } from "@/services/supabase/vportClient";
import {
  normalizeReviewSummary,
  normalizeTeamResources,
  slugifySegment,
} from "@/features/wanderex/model/wanderexPublic.model";
import {
  buildAvailabilityCalendarByResource,
  buildNextSlotsForResource,
  hasOpenNow,
} from "@/features/wanderex/model/wanderexAvailability.model";

export const DIRECTORY_SELECT = [
  "id",
  "actor_id",
  "slug",
  "name",
  "bio",
  "avatar_url",
  "banner_url",
  "category_key",
  "city",
  "location_text",
  "address",
  "directory_visible",
  "directory_status",
  "created_at",
].join(",");

export const PROFILE_SELECT = `
  id,
  actor_id,
  slug,
  name,
  bio,
  avatar_url,
  banner_url,
  is_active,
  is_deleted,
  directory_visible,
  directory_status,
  public_details:profile_public_details!inner (
    location_text,
    address,
    phone_public,
    email_public,
    website_url,
    booking_url,
    logo_url,
    accent_color
  ),
  profile_categories (
    category_key,
    is_primary
  )
`;

export const RESOURCE_SELECT = "id,profile_id,name,resource_type,member_actor_id,is_active,sort_order,meta";
export const RULE_SELECT = "id,resource_id,weekday,start_time,end_time,valid_from,valid_until,is_active";
export const BOOKING_SELECT = "id,profile_id,resource_id,status,starts_at,ends_at,service_label_snapshot,customer_name";
export const REVIEW_SUMMARY_SELECT = "target_actor_id,review_count,average_rating";

export async function readServicesByActorId(actorId) {
  const { data: profile } = await vport.from("profiles").select("id").eq("actor_id", actorId).maybeSingle();
  if (!profile?.id) return [];
  const COLS = "id,profile_id,key,label,description,service_group,sort_order,enabled,meta,created_at,updated_at";
  const { data } = await vport.from("services").select(COLS).eq("profile_id", profile.id).eq("enabled", true).order("sort_order", { ascending: true }).order("key", { ascending: true });
  return Array.isArray(data) ? data : [];
}

export async function readBookingProfilesByServiceIds(serviceIds) {
  const ids = [...new Set((Array.isArray(serviceIds) ? serviceIds : []).filter(Boolean).map(String))];
  if (!ids.length) return [];
  const COLS = "service_id,duration_minutes,padding_before_minutes,padding_after_minutes,booking_mode,max_concurrent,is_bookable,price_cents,currency_code,created_at,updated_at";
  const { data } = await supabase.schema("vc").from("booking_service_profiles").select(COLS).in("service_id", ids).eq("is_bookable", true).order("created_at", { ascending: true });
  return Array.isArray(data) ? data : [];
}

export async function readPublicReviewsByActorId(actorId, { limit = 20, cursor = null } = {}) {
  const COLS = "review_id,target_actor_id,author_actor_id,verification_status,overall_rating,body,author_display_name_snapshot,author_username_snapshot,author_avatar_url_snapshot,review_activity_at,created_at";
  let q = supabase.schema("reviews").from("public_vport_reviews_v").select(COLS).eq("target_actor_id", actorId).order("review_activity_at", { ascending: false }).limit(limit + 1);
  if (cursor) q = q.lt("review_activity_at", cursor);
  const { data, error } = await q;
  if (error) throw error;
  const rows = data ?? [];
  const hasMore = rows.length > limit;
  return { rows: hasMore ? rows.slice(0, limit) : rows, hasMore };
}

function normalizeReviewCard(raw) {
  if (!raw?.review_id) return null;
  return {
    id: raw.review_id,
    targetActorId: raw.target_actor_id ?? null,
    authorActorId: raw.author_actor_id ?? null,
    verificationStatus: raw.verification_status ?? null,
    overallRating: raw.overall_rating != null ? parseFloat(raw.overall_rating) : null,
    body: String(raw.body ?? "").trim() || null,
    authorDisplayName: String(raw.author_display_name_snapshot ?? "").trim() || "Anonymous",
    authorUsername: String(raw.author_username_snapshot ?? "").trim() || null,
    authorAvatarUrl: String(raw.author_avatar_url_snapshot ?? "").trim() || null,
    reviewActivityAt: raw.review_activity_at ?? raw.created_at ?? null,
    createdAt: raw.created_at ?? null,
  };
}

export function normalizePublicReviewCards(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(normalizeReviewCard).filter(Boolean);
}

export async function readProfilePublicDetailsIds(profileIds) {
  const ids = (Array.isArray(profileIds) ? profileIds : []).filter(Boolean);
  if (!ids.length) return new Set();

  const { data, error } = await vport
    .from("profile_public_details")
    .select("profile_id")
    .in("profile_id", ids);

  if (error) throw error;
  return new Set((data || []).map((row) => row.profile_id).filter(Boolean));
}

export async function readReviewSummaryMap(actorIds) {
  const ids = (Array.isArray(actorIds) ? actorIds : []).filter(Boolean);
  if (!ids.length) return {};

  const { data, error } = await supabase
    .schema("reviews")
    .from("public_vport_review_summary_v")
    .select(REVIEW_SUMMARY_SELECT)
    .in("target_actor_id", ids);

  if (error) throw error;

  return (data || []).reduce((acc, row) => {
    acc[row.target_actor_id] = normalizeReviewSummary(row);
    return acc;
  }, {});
}

export async function readActiveTeamResourcesByProfileIds(profileIds) {
  const ids = (Array.isArray(profileIds) ? profileIds : []).filter(Boolean);
  if (!ids.length) return [];

  const { data, error } = await vport
    .from("resources")
    .select(RESOURCE_SELECT)
    .eq("resource_type", "staff")
    .eq("is_active", true)
    .in("profile_id", ids)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function readAvailabilityRulesByResourceIds(resourceIds) {
  const ids = (Array.isArray(resourceIds) ? resourceIds : []).filter(Boolean);
  if (!ids.length) return [];

  const { data, error } = await vport
    .from("availability_rules")
    .select(RULE_SELECT)
    .eq("is_active", true)
    .in("resource_id", ids)
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function readBookingsInRangeByProfileIds(profileIds, rangeStartIso, rangeEndIso) {
  const ids = (Array.isArray(profileIds) ? profileIds : []).filter(Boolean);
  if (!ids.length) return [];

  const { data, error } = await vport
    .from("bookings")
    .select(BOOKING_SELECT)
    .in("profile_id", ids)
    .gte("starts_at", rangeStartIso)
    .lte("starts_at", rangeEndIso)
    .not("status", "in", '("cancelled","declined")');

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export function buildDirectoryAvailabilityState({ profileIds, resources, rules, bookings }) {
  const resourcesByProfile = {};
  (resources || []).forEach((resource) => {
    resourcesByProfile[resource.profile_id] = resourcesByProfile[resource.profile_id] || [];
    resourcesByProfile[resource.profile_id].push(resource);
  });

  const calendarByProfile = {};
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  (profileIds || []).forEach((profileId) => {
    const team = normalizeTeamResources(resourcesByProfile[profileId] || []);
    if (!team.length) {
      calendarByProfile[profileId] = { isOpenNow: false, isBookable: false };
      return;
    }

    const teamResourceIds = team.map((member) => member.id);
    const teamRules = (rules || []).filter((row) => teamResourceIds.includes(row.resource_id));
    const teamBookings = (bookings || []).filter((row) => teamResourceIds.includes(row.resource_id));

    const calendarByResource = buildAvailabilityCalendarByResource({
      resources: team,
      rules: teamRules,
      bookings: teamBookings,
      startDate: start,
      days: 14,
    });

    const openNow = team.some((member) => hasOpenNow(calendarByResource[member.id] || {}));
    const bookable = team.some((member) => {
      const next = buildNextSlotsForResource({
        calendarByDate: calendarByResource[member.id] || {},
        durationMinutes: 30,
        limit: 1,
      });
      return next.length > 0;
    });

    calendarByProfile[profileId] = { isOpenNow: openNow, isBookable: bookable };
  });

  return calendarByProfile;
}
