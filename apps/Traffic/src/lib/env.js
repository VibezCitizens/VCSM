const DEFAULT_SITE_ORIGIN = "https://traffic.vibezcitizens.com";
const DEFAULT_PLATFORM_ORIGIN = "https://vibezcitizens.com";
const DEFAULT_PUBLIC_CONTENT_PATH = "/api/public/content-pages";
const DEFAULT_PUBLIC_REVIEW_SUMMARY_PATH = "/api/public/vport-review-summary";

export function getSiteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_ORIGIN ?? DEFAULT_SITE_ORIGIN;
}

export function getPlatformOrigin() {
  return process.env.NEXT_PUBLIC_PLATFORM_ORIGIN ?? DEFAULT_PLATFORM_ORIGIN;
}

export function getPublicContentApiUrl() {
  const explicitUrl =
    process.env.TRAFFIC_PUBLIC_CONTENT_API_URL ??
    process.env.NEXT_PUBLIC_TRAFFIC_PUBLIC_CONTENT_API_URL;

  if (explicitUrl) {
    return explicitUrl;
  }

  return new URL(DEFAULT_PUBLIC_CONTENT_PATH, getPlatformOrigin()).toString();
}

export function getPublicReviewSummaryApiUrl() {
  const explicitUrl =
    process.env.TRAFFIC_PUBLIC_REVIEW_SUMMARY_API_URL ??
    process.env.NEXT_PUBLIC_TRAFFIC_PUBLIC_REVIEW_SUMMARY_API_URL;

  if (explicitUrl) {
    return explicitUrl;
  }

  return new URL(DEFAULT_PUBLIC_REVIEW_SUMMARY_PATH, getPlatformOrigin()).toString();
}
