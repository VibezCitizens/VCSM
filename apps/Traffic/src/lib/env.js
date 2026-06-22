const DEFAULT_SITE_ORIGIN = "https://traze.vibezcitizens.com";
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

function getBuildBranchName() {
  return (
    process.env.CF_PAGES_BRANCH ??
    process.env.CLOUDFLARE_BRANCH ??
    process.env.VERCEL_GIT_COMMIT_REF ??
    process.env.GITHUB_HEAD_REF ??
    process.env.GITHUB_REF_NAME ??
    process.env.BRANCH ??
    null
  );
}

function isPreviewBuild() {
  return Boolean(
    process.env.CF_PAGES_PULL_REQUEST_ID ||
      process.env.GITHUB_EVENT_NAME === "pull_request" ||
      process.env.VERCEL_ENV === "preview"
  );
}

export function shouldRequireLiveProviderIndex() {
  if (process.env.TRAFFIC_ALLOW_EMPTY_PROVIDER_INDEX === "true") return false;
  if (process.env.TRAFFIC_REQUIRE_PROVIDER_INDEX === "true") return true;
  if (process.env.NODE_ENV !== "production") return false;

  const branch = getBuildBranchName();
  if (branch) {
    return branch === "main" || branch === "production";
  }

  return !isPreviewBuild();
}
