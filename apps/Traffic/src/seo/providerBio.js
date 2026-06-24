// Single source of truth for the placeholder bios that
// data/mappers/providerIndex.model.js assigns when a provider has no real bio
// (seed + vport shapes). Keeps those placeholders out of meta descriptions and
// LocalBusiness.description (TICKET-TRAZE-SEO-REMEDIATION-001 — G).

export function meaningfulProviderBio(provider) {
  const bio = String(provider?.shortBio ?? "").trim();
  const displayName = provider?.displayName ?? "";
  const placeholders = [
    `Visit ${displayName} on Vibez Citizens.`,
    `${displayName} is listed on TRAZE as an unclaimed local business.`
  ];
  if (!bio || placeholders.includes(bio)) {
    return null;
  }
  return bio;
}

// Description used for both <meta description>/OpenGraph and LocalBusiness schema:
// the real bio when present, otherwise a unique, non-placeholder fallback.
export function providerMetaDescription(provider) {
  return (
    meaningfulProviderBio(provider) ||
    `Learn more about ${provider?.displayName ?? "this provider"}. View services, reviews, and book directly.`
  );
}
