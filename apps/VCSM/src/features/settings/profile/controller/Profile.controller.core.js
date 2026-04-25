// src/features/settings/profile/controller/Profile.controller.core.js
// ============================================================
// Profile Controller CORE (PURE)
// - No React
// - Orchestrates use-case meaning
// - Calls DAL + Models
// ============================================================

import { fetchProfile } from '../dal/profile.read.dal'
import { updateProfile } from '../dal/profile.write.dal'
import { mapProfileToView, mapProfileUpdate } from '../model/profile.mapper'
import { refreshVcActorDirectory } from '@/features/identity/dal/refreshActorDirectory.dal'
import { dalReadActorIdByProfileId, dalReadActorIdByVportId } from '../dal/actorIdBySubject.read.dal'
import { invalidateActorProfileCache } from '@/features/profiles/dal/readActorProfile.dal'
import { useActorStore } from '@hydration'

export async function loadProfileCore({ subjectId, mode }) {
  const raw = await fetchProfile(subjectId, mode)
  return mapProfileToView(raw, mode)
}

export async function saveProfileCore({
  subjectId,
  mode,
  draft,
  uploads,
}) {
  if (!subjectId) throw new Error('saveProfile: subjectId missing')

  // Clean permanent URLs for DB writes
  let nextPhotoUrl = draft.photoUrl?.split('?')[0] || null
  let nextBannerUrl = draft.bannerUrl?.split('?')[0] || null

  if (draft.__avatarFile) {
    const uploaded = await uploads.uploadAvatar(draft.__avatarFile)
    if (uploaded) nextPhotoUrl = uploaded.split('?')[0] // store clean URL
  }

  if (draft.__bannerFile) {
    const uploaded = await uploads.uploadBanner(draft.__bannerFile)
    if (uploaded) nextBannerUrl = uploaded.split('?')[0]
  }

  const normalizedUi = {
    ...draft,
    photoUrl: nextPhotoUrl || null,
    bannerUrl: nextBannerUrl || null,
  }

  const payload = mapProfileUpdate(normalizedUi, mode)

  // DB write — uses clean permanent URLs
  const dbRow = await updateProfile(subjectId, mode, payload)

  // Confirmed clean URLs from DB (user) or upload (vport)
  const confirmedPhotoUrl = dbRow?.photo_url ?? nextPhotoUrl ?? ''
  const confirmedBannerUrl = dbRow?.banner_url ?? nextBannerUrl ?? ''

  // Cache-bust suffix for local display only — CDN may serve stale bytes otherwise
  const ts = Date.now()
  const displayPhotoUrl = confirmedPhotoUrl ? `${confirmedPhotoUrl}?v=${ts}` : confirmedPhotoUrl
  const displayBannerUrl = confirmedBannerUrl && confirmedBannerUrl !== '/default-banner.jpg'
    ? `${confirmedBannerUrl}?v=${ts}`
    : confirmedBannerUrl

  // Resolve actorId for downstream cache invalidation
  let actorId = null
  try {
    if (mode === 'user') {
      actorId = await dalReadActorIdByProfileId(subjectId)
    } else if (mode === 'vport') {
      actorId = await dalReadActorIdByVportId(subjectId)
    }
  } catch {}

  // Refresh actor directory projection (non-fatal)
  if (actorId) {
    try { refreshVcActorDirectory(actorId) } catch {}
  }

  // Bust the 30s profile page cache so navigation to the profile sees fresh data
  if (actorId) {
    try { invalidateActorProfileCache(actorId) } catch {}
  }

  // Force-update the hydration store — feeds/chat avatars update without waiting for TTL
  if (actorId) {
    try {
      useActorStore.getState().upsertActors([{
        actor_id: actorId,
        photo_url: confirmedPhotoUrl,
        banner_url: confirmedBannerUrl,
        ...(mode === 'vport' && {
          vport_avatar_url: confirmedPhotoUrl,
        }),
      }], { force: true })
    } catch {}
  }

  return {
    ...draft,
    actorId: draft.actorId ?? null,
    photoUrl: displayPhotoUrl,
    bannerUrl: displayBannerUrl,
    __avatarFile: null,
    __bannerFile: null,
  }
}

