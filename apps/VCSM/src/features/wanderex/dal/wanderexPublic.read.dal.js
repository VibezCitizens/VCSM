import { vport } from "@/services/supabase/vportClient";
import {
  normalizeDirectoryCard,
  normalizeWanderExProfile,
  mergeServicesWithBookingProfiles,
  normalizeTeamResources,
  slugifySegment,
} from "@/features/wanderex/model/wanderexPublic.model";
import {
  buildAvailabilityCalendarByResource,
  buildNextSlotsForResource,
  hasOpenNow,
} from "@/features/wanderex/model/wanderexAvailability.model";
import {
  DIRECTORY_SELECT,
  PROFILE_SELECT,
  readServicesByActorId,
  readBookingProfilesByServiceIds,
  readPublicReviewsByActorId,
  normalizePublicReviewCards,
  readProfilePublicDetailsIds,
  readReviewSummaryMap,
  readActiveTeamResourcesByProfileIds,
  readAvailabilityRulesByResourceIds,
  readBookingsInRangeByProfileIds,
  buildDirectoryAvailabilityState,
} from "@/features/wanderex/dal/wanderexPublicHelpers.read.dal";

export async function listWanderExDirectoryProfilesDAL({
  category = "",
  city = "",
  openNow = false,
  bookable = false,
  topRated = false,
  limit = 60,
} = {}) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 60));

  let query = vport
    .from("public_traze_profiles_v")
    .select(DIRECTORY_SELECT)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (category) {
    query = query.eq("category_key", String(category).trim().toLowerCase());
  }

  const { data, error } = await query;
  if (error) throw error;

  const rawRows = Array.isArray(data) ? data : [];
  if (!rawRows.length) return { cards: [], facets: { categories: [], cities: [] } };

  const detailIds = await readProfilePublicDetailsIds(rawRows.map((row) => row.id));
  const visibleRows = rawRows.filter((row) => detailIds.has(row.id));

  const citySlug = slugifySegment(city);
  const cityFilteredRows = citySlug
    ? visibleRows.filter((row) => {
        const candidates = [row.city, row.location_text]
          .map((value) => slugifySegment(value))
          .filter(Boolean);
        return candidates.some((candidate) => candidate.includes(citySlug));
      })
    : visibleRows;

  const actorIds = cityFilteredRows.map((row) => row.actor_id).filter(Boolean);
  const profileIds = cityFilteredRows.map((row) => row.id).filter(Boolean);

  const [ratingByActorId, resources] = await Promise.all([
    readReviewSummaryMap(actorIds),
    readActiveTeamResourcesByProfileIds(profileIds),
  ]);

  const resourceIds = resources.map((row) => row.id).filter(Boolean);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const rangeStartIso = now.toISOString();
  const rangeEnd = new Date(now);
  rangeEnd.setDate(rangeEnd.getDate() + 14);

  const [rules, bookings] = await Promise.all([
    readAvailabilityRulesByResourceIds(resourceIds),
    readBookingsInRangeByProfileIds(profileIds, rangeStartIso, rangeEnd.toISOString()),
  ]);

  const availabilityState = buildDirectoryAvailabilityState({
    profileIds,
    resources,
    rules,
    bookings,
  });

  const bookableByProfileId = {};
  const openNowByProfileId = {};
  Object.entries(availabilityState).forEach(([profileId, state]) => {
    bookableByProfileId[profileId] = Boolean(state.isBookable);
    openNowByProfileId[profileId] = Boolean(state.isOpenNow);
  });

  let cards = cityFilteredRows.map((row) =>
    normalizeDirectoryCard(row, {
      ratingByActorId,
      bookableByProfileId,
      openNowByProfileId,
    })
  );

  if (bookable) cards = cards.filter((card) => card.isBookable);
  if (openNow) cards = cards.filter((card) => card.isOpenNow);
  if (topRated) cards = cards.filter((card) => (card.ratingAverage || 0) >= 4);

  cards.sort((a, b) => {
    if (topRated) {
      const scoreA = (a.ratingAverage || 0) * 100 + (a.ratingCount || 0);
      const scoreB = (b.ratingAverage || 0) * 100 + (b.ratingCount || 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
    }
    if (bookable && a.isBookable !== b.isBookable) return a.isBookable ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const facets = {
    categories: [...new Set(cards.map((card) => card.categoryKey).filter(Boolean))],
    cities: [...new Set(cards.map((card) => card.city).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    ),
  };

  return { cards, facets };
}

export async function readWanderExProfileBundleBySlugDAL({ slug } = {}) {
  const key = String(slug || "").trim().toLowerCase();
  if (!key) return null;

  const { data: profileRow, error: profileError } = await vport
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("slug", key)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .eq("directory_visible", true)
    .eq("directory_status", "listed")
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profileRow) return null;

  if (!profileRow.public_details) {
    return null;
  }

  const actorId = profileRow.actor_id;
  const profileId = profileRow.id;

  const [
    reviewSummaryMap,
    reviewRows,
    servicesRaw,
    resourcesRaw,
  ] = await Promise.all([
    readReviewSummaryMap([actorId]),
    readPublicReviewsByActorId(actorId, { limit: 8 }).catch(() => ({ rows: [] })),
    readServicesByActorId(actorId).catch(() => []),
    readActiveTeamResourcesByProfileIds([profileId]).catch(() => []),
  ]);

  const serviceIds = servicesRaw.map((service) => service.id).filter(Boolean);
  const bookingProfiles = serviceIds.length
    ? await readBookingProfilesByServiceIds(serviceIds).catch(() => [])
    : [];

  const services = mergeServicesWithBookingProfiles(servicesRaw, bookingProfiles);
  const bookableServices = services.filter((service) => service.isBookable);

  const team = normalizeTeamResources(resourcesRaw);
  const resourceIds = team.map((member) => member.id);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);

  const [rules, bookings] = await Promise.all([
    readAvailabilityRulesByResourceIds(resourceIds),
    readBookingsInRangeByProfileIds([profileId], start.toISOString(), end.toISOString()),
  ]);

  const availabilityCalendarByResource = buildAvailabilityCalendarByResource({
    resources: team,
    rules,
    bookings,
    startDate: start,
    days: 14,
  });

  const teamWithAvailability = team.map((member) => {
    const calendarByDate = availabilityCalendarByResource[member.id] || {};
    const nextSlots = buildNextSlotsForResource({
      calendarByDate,
      durationMinutes: 30,
      limit: 3,
    });

    return {
      ...member,
      isOpenNow: hasOpenNow(calendarByDate),
      nextSlots,
    };
  });

  const reviewSummary = reviewSummaryMap[actorId] || { averageRating: null, reviewCount: 0 };
  const profile = normalizeWanderExProfile(profileRow, { reviewSummary });

  return {
    profile,
    services,
    bookableServices,
    team: teamWithAvailability,
    availabilityCalendarByResource,
    availabilityRules: rules,
    bookings,
    reviews: normalizePublicReviewCards(reviewRows?.rows || []),
    reviewSummary,
    hasBookable: teamWithAvailability.some((member) => member.nextSlots.length > 0),
  };
}

export default {
  listWanderExDirectoryProfilesDAL,
  readWanderExProfileBundleBySlugDAL,
};
