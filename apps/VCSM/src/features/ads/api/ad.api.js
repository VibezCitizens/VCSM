import { listAdsByActor, removeAd, upsertAd } from "@/features/ads/dal/ad.storage.dal";

export async function fetchAds(actorId) {
  return listAdsByActor({ actorId });
}

export async function saveAd(payload) {
  return upsertAd(payload);
}

export async function deleteAd(id) {
  return removeAd({ id });
}
