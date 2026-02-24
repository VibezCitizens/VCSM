import { AD_STATUSES } from "@/features/ads/constants";
import { deleteAd, fetchAds, saveAd } from "@/features/ads/api/ad.api";
import { validateAdDraft } from "@/features/ads/lib/ad.validation";
import { createAdDraft } from "@/features/ads/model/ad.model";

function stamp(ad, patch) {
  return {
    ...ad,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export async function listAdsUseCase(actorId) {
  return fetchAds(actorId);
}

export function createDraftUseCase(actorId) {
  return createAdDraft({ actorId });
}

export async function saveDraftUseCase(ad) {
  const validation = validateAdDraft(ad);
  if (!validation.valid) {
    const error = new Error("Validation failed");
    error.fieldErrors = validation.errors;
    throw error;
  }
  return saveAd(stamp(ad, { status: ad.status || AD_STATUSES.DRAFT }));
}

export async function publishAdUseCase(ad) {
  const validation = validateAdDraft(ad);
  if (!validation.valid) {
    const error = new Error("Validation failed");
    error.fieldErrors = validation.errors;
    throw error;
  }
  return saveAd(stamp(ad, { status: AD_STATUSES.ACTIVE }));
}

export async function pauseAdUseCase(ad) {
  return saveAd(stamp(ad, { status: AD_STATUSES.PAUSED }));
}

export async function archiveAdUseCase(ad) {
  return saveAd(stamp(ad, { status: AD_STATUSES.ARCHIVED }));
}

export async function deleteAdUseCase(id) {
  return deleteAd(id);
}
