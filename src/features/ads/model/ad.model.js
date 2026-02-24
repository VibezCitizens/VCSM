import { AD_FORMATS, AD_MONETIZATION, AD_STATUSES, DEFAULT_AD_BUDGET } from "@/features/ads/constants";

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `ad_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createAdDraft({ actorId }) {
  return {
    id: createId(),
    actorId: actorId || null,
    title: "",
    description: "",
    mediaUrl: "",
    destinationUrl: "",
    format: AD_FORMATS[0],
    status: AD_STATUSES.DRAFT,
    budget: DEFAULT_AD_BUDGET,
    ctaLabel: "Learn more",
    startAt: null,
    endAt: null,
    monetization: { ...AD_MONETIZATION },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function normalizeAd(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    id: String(raw.id || ""),
    actorId: raw.actorId ? String(raw.actorId) : null,
    title: String(raw.title || ""),
    description: String(raw.description || ""),
    mediaUrl: String(raw.mediaUrl || ""),
    destinationUrl: String(raw.destinationUrl || ""),
    format: AD_FORMATS.includes(raw.format) ? raw.format : AD_FORMATS[0],
    status: Object.values(AD_STATUSES).includes(raw.status) ? raw.status : AD_STATUSES.DRAFT,
    budget: Number.isFinite(Number(raw.budget)) ? Number(raw.budget) : DEFAULT_AD_BUDGET,
    ctaLabel: String(raw.ctaLabel || "Learn more"),
    startAt: raw.startAt || null,
    endAt: raw.endAt || null,
    monetization: {
      ...AD_MONETIZATION,
      ...(raw.monetization || {}),
    },
    createdAt: raw.createdAt || nowIso(),
    updatedAt: raw.updatedAt || nowIso(),
  };
}
