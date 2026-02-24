import { ADS_STORAGE_KEY } from "@/features/ads/constants";
import { normalizeAd } from "@/features/ads/model/ad.model";

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
    .map(normalizeAd)
    .filter(Boolean);

  return all
    .filter((item) => item.actorId === actorId)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function upsertAd(ad) {
  const normalized = normalizeAd(ad);
  if (!normalized?.id) {
    throw new Error("[ads] invalid ad payload");
  }

  const all = readAll().map(normalizeAd).filter(Boolean);
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
  const all = readAll().map(normalizeAd).filter(Boolean);
  const next = all.filter((item) => item.id !== id);
  writeAll(next);
}
