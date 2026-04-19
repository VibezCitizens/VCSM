import { getSiteOrigin } from "@/lib/env";

export function buildCanonical(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, getSiteOrigin()).toString();
}
