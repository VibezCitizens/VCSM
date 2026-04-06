import { ADS_STORAGE_KEY } from "@/features/ads/constants";

function normalizeStoredAd(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    ...raw,
    id: raw.id ? String(raw.id) : "",
    actorId: raw.actorId ? String(raw.actorId) : null,
    updatedAt: raw.updatedAt || raw.createdAt || null,
  };
}

function safeParse(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readAll() {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(ADS_STORAGE_KEY));
}

function writeAll(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(items));
}

export async function listAdsByActor({ actorId }) {
  const all = readAll()
    .map(normalizeStoredAd)
    .filter(Boolean);

  return all
    .filter((item) => item.actorId === actorId)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function upsertAd(ad) {
  const normalized = normalizeStoredAd(ad);
  if (!normalized?.id) {
    throw new Error("[ads] invalid ad payload");
  }

  const all = readAll().map(normalizeStoredAd).filter(Boolean);
  const idx = all.findIndex((item) => item.id === normalized.id);
  if (idx >= 0) {
    all[idx] = normalized;
  } else {
    all.push(normalized);
  }

  writeAll(all);
  return normalized;
}

export async function removeAd({ id }) {
  const all = readAll().map(normalizeStoredAd).filter(Boolean);
  const next = all.filter((item) => item.id !== id);
  writeAll(next);
}
