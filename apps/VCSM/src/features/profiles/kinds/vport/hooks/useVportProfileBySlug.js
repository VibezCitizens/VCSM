// src/features/profiles/kinds/vport/hooks/useVportProfileBySlug.js
//
// Single React Query source of truth for a VPORT profile accessed by slug.
// Called from both ActorProfileScreen (debug panel) and VportProfileViewScreen (data).
// React Query deduplication means only ONE fetch fires regardless of how many
// components call this hook with the same slug.
//
// Query chain (all staleTime = 5 min):
//   Q1 ["vport", "profile-by-slug", slug]   → resolveActorBySlugOrUsernameDAL
//   Q2 ["vport", "profile",         actorId] → buildActorCanonicalSlugController
//   Q3 ["vport", "public-details",  actorId] → getVportPublicDetailsController
//
// Slug formats handled:
//   "barbershop-uiys"      → human slug — Q1 resolves via DB (hits DAL TTL cache)
//   "766484aa-5043-..."    → bare UUID canonical fallback — Q1 skipped, UUID used directly
//   "self" / null / ""     → disabled — returns empty loading=false state

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import { resolveActorBySlugController } from '@/features/profiles/controller/resolveActorBySlug.controller'
import { buildActorCanonicalSlugController } from '@/features/profiles/controller/buildActorCanonicalSlug.controller'
import { getVportPublicDetailsController } from '@/features/profiles/kinds/vport/controller/getVportPublicDetails.controller'
import { extractActorIdFromSlug } from '@/shared/lib/actorSlug'

const STALE_MS = 5 * 60 * 1000

/**
 * @param {string|null} slug  — canonical route param (:actorId) from the profile URL
 * @returns {{
 *   profileId:    string|null,   — vport.profiles.id, stable key for tab sub-queries
 *   actorId:      string|null,   — vc.actors.id
 *   slug:         string|null,   — stored slug from vport.profiles
 *   canonicalSlug: string|null,  — full canonical SEO slug (may equal actorId as fallback)
 *   name:         string|null,
 *   categoryKey:  string|null,   — vportType (e.g. "barbershop", "restaurant")
 *   avatarUrl:    string|null,
 *   bannerUrl:    string|null,
 *   publicDetails: object|null,  — full mapped public details (hours, address, etc.)
 *   isLoading:    boolean,
 *   error:        Error|null,
 * }}
 */
export function useVportProfileBySlug(slug) {
  const normSlug = typeof slug === 'string' && slug.trim().length > 0 ? slug.trim() : null

  // When the route param IS a bare UUID (actorId used as canonical fallback slug),
  // skip slug resolution — the UUID is already the actorId.
  // extractActorIdFromSlug handles both "uuid" and "uuid-suffix" formats.
  const uuidFromSlug = normSlug ? extractActorIdFromSlug(normSlug) : null
  const isUuidSlug = !!uuidFromSlug
  const isResolvableSlug = !!normSlug && !isUuidSlug && normSlug !== 'self'

  // Q1: human slug → actorId
  const slugQuery = useQuery({
    queryKey: queryKeys.vportProfileBySlug(normSlug),
    queryFn: () => resolveActorBySlugController(normSlug),
    enabled: isResolvableSlug,
    staleTime: STALE_MS,
    gcTime: STALE_MS,
    retry: 1,
  })

  const actorId = isUuidSlug
    ? uuidFromSlug
    : (slugQuery.data?.actorId ?? null)

  // Q2: actorId → canonical slug + SEO meta
  const profileQuery = useQuery({
    queryKey: queryKeys.vportProfile(actorId),
    queryFn: () => buildActorCanonicalSlugController(actorId),
    enabled: !!actorId,
    staleTime: STALE_MS,
    gcTime: STALE_MS,
    retry: 1,
  })

  // Q3: actorId → public details (name, avatar, banner, type, hours, address, etc.)
  const detailsQuery = useQuery({
    queryKey: queryKeys.vportPublicDetails(actorId),
    queryFn: () => getVportPublicDetailsController(actorId),
    enabled: !!actorId,
    staleTime: STALE_MS,
    gcTime: STALE_MS,
    retry: 1,
  })

  const details = detailsQuery.data ?? null
  const canonicalSlug = profileQuery.data?.canonicalSlug ?? null

  const isLoading =
    (isResolvableSlug && slugQuery.isPending) ||
    (!!actorId && (profileQuery.isPending || detailsQuery.isPending))

  const error = slugQuery.error ?? profileQuery.error ?? detailsQuery.error ?? null

  return {
    profileId:     details?.profileId ?? null,
    actorId,
    slug:          details?.slug ?? null,
    canonicalSlug,
    name:          details?.name ?? null,
    categoryKey:   details?.vportType ?? null,
    avatarUrl:     details?.avatarUrl ?? null,
    bannerUrl:     details?.bannerUrl ?? null,
    publicDetails: details,
    isLoading,
    error,
  }
}
