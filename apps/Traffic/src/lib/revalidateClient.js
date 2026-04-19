import { getSiteOrigin } from "@/lib/env";

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const output = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
}

function normalizePathArray(value) {
  return normalizeStringArray(value).filter((entry) => entry.startsWith("/"));
}

function getRevalidateEndpoint(endpoint) {
  if (endpoint) {
    return endpoint;
  }

  return new URL("/api/revalidate", getSiteOrigin()).toString();
}

export async function triggerTrafficRevalidation({
  paths = [],
  tags = [],
  endpoint,
  secret = process.env.REVALIDATE_SECRET,
  signal
} = {}) {
  const normalizedPaths = normalizePathArray(paths);
  const normalizedTags = normalizeStringArray(tags);

  if (!normalizedPaths.length && !normalizedTags.length) {
    return {
      success: false,
      revalidated: [],
      error: "No paths or tags provided."
    };
  }

  if (!secret) {
    throw new Error("REVALIDATE_SECRET is required to trigger on-demand revalidation.");
  }

  const response = await fetch(getRevalidateEndpoint(endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-revalidate-secret": secret
    },
    body: JSON.stringify({
      paths: normalizedPaths,
      tags: normalizedTags
    }),
    cache: "no-store",
    signal
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error || `Revalidation request failed (${response.status}).`;
    throw new Error(message);
  }

  return payload ?? { success: true, revalidated: [] };
}
