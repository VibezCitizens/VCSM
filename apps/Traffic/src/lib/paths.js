function safe(segment) {
  return String(segment ?? "").trim();
}

export function countryPath(countrySlug) {
  return `/${safe(countrySlug)}`;
}

export function cityPath(citySlug) {
  return `/${safe(citySlug)}`;
}

export function cityServicePath(citySlug, serviceSlug) {
  return `/${safe(citySlug)}/${safe(serviceSlug)}`;
}

export function neighborhoodServicePath(citySlug, neighborhoodSlug, serviceSlug) {
  return `/${safe(citySlug)}/${safe(neighborhoodSlug)}/${safe(serviceSlug)}`;
}

export function neighborhoodServiceSpecialtyPath(citySlug, neighborhoodSlug, serviceSlug, specialtySlug) {
  return `/${safe(citySlug)}/${safe(neighborhoodSlug)}/${safe(serviceSlug)}/${safe(specialtySlug)}`;
}

export function providerPath(providerSlug) {
  return `/pro/${safe(providerSlug)}`;
}

export function countryCityPath(countrySlug, citySlug) {
  return `/${safe(countrySlug)}/${safe(citySlug)}`;
}

export function countryCityServicePath(countrySlug, citySlug, serviceSlug) {
  return `/${safe(countrySlug)}/${safe(citySlug)}/${safe(serviceSlug)}`;
}

export function countryServiceHubPath(countrySlug, serviceSlug) {
  return `/${safe(countrySlug)}/services/${safe(serviceSlug)}`;
}

export function countryCityLocalityServicePath(countrySlug, citySlug, localitySlug, serviceSlug) {
  return `/${safe(countrySlug)}/${safe(citySlug)}/${safe(localitySlug)}/${safe(serviceSlug)}`;
}

export function countryCityLocalityServiceSpecialtyPath(
  countrySlug,
  citySlug,
  localitySlug,
  serviceSlug,
  specialtySlug
) {
  return `/${safe(countrySlug)}/${safe(citySlug)}/${safe(localitySlug)}/${safe(serviceSlug)}/${safe(specialtySlug)}`;
}

export function countryProviderPath(countrySlug, providerSlug) {
  return `/pro/${safe(providerSlug)}`;
}

export function contentGuidePath(slug) {
  return `/guides/${safe(slug)}`;
}

export function contentGuideCanonicalPath(profileSlug, contentSlug) {
  const safeProfileSlug = safe(profileSlug);
  if (!safeProfileSlug) {
    return contentGuidePath(contentSlug);
  }

  return `/guides/${safeProfileSlug}/${safe(contentSlug)}`;
}
