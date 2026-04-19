import { getPlatformOrigin } from "@/lib/env";

/**
 * @typedef {Object} DiscoveryContext
 * @property {string} [countrySlug]
 * @property {string} [citySlug]
 * @property {string} [localitySlug]
 * @property {string} [neighborhoodSlug]
 * @property {string} [serviceSlug]
 */

function buildUrl(path, params) {
  const url = new URL(path, getPlatformOrigin());

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (!value) {
        continue;
      }
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

function getLocalitySlug(context) {
  return context?.localitySlug ?? context?.neighborhoodSlug;
}

export const TRAFFIC_SOURCE = "traffic";

function withTrafficAttribution(params, surface) {
  return {
    ...params,
    source: TRAFFIC_SOURCE,
    surface
  };
}

export function buildPlatformExploreLink(context, surface = "directory") {
  return buildUrl("/explore", {
    ...withTrafficAttribution(
      {
        country: context?.countrySlug,
        city: context?.citySlug,
        locality: getLocalitySlug(context),
        service: context?.serviceSlug
      },
      surface
    )
  });
}

export function buildPlatformProviderLink(providerSlug, vcsmSlug, surface = "provider") {
  const slug = vcsmSlug || providerSlug;
  return buildUrl(`/profile/${slug}`, {
    ...withTrafficAttribution({}, surface)
  });
}

export function buildPlatformBookingLink(providerSlug, context, vcsmSlug, surface = "provider") {
  const slug = vcsmSlug || providerSlug;
  return buildUrl("/booking", {
    ...withTrafficAttribution(
      {
        provider: slug,
        country: context?.countrySlug,
        city: context?.citySlug,
        locality: getLocalitySlug(context),
        service: context?.serviceSlug
      },
      surface
    )
  });
}

export function buildPlatformFollowLink(providerSlug, vcsmSlug, surface = "provider") {
  const slug = vcsmSlug || providerSlug;
  return buildUrl("/follow", {
    ...withTrafficAttribution(
      {
        actor: slug
      },
      surface
    )
  });
}

/**
 * Build a claim link for unclaimed providers.
 * Returns null if the provider already has a VCSM actor (claimed and linked).
 * @param {string} providerSlug
 * @param {string|null} [vcsmActorId]
 * @returns {string|null}
 */
export function buildPlatformClaimLink(providerSlug, vcsmActorId, surface = "provider") {
  if (vcsmActorId) {
    return null;
  }

  return buildUrl("/claim-profile", {
    ...withTrafficAttribution(
      {
        provider: providerSlug
      },
      surface
    )
  });
}
