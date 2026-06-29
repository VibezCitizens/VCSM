// src/features/settings/profile/controller/Profile.controller.core.js
// ============================================================
// Profile Controller CORE (PURE)
// - No React
// - Orchestrates use-case meaning
// - Calls DAL + Models
// ============================================================

import { fetchProfile } from '@/features/settings/profile/dal/profile.read.dal'
import { updateProfile } from '@/features/settings/profile/dal/profile.write.dal'
import { mapProfileToView, mapProfileUpdate } from '@/features/settings/profile/model/profile.model'
import { dalReadActorIdByProfileId, dalReadActorIdByVportId } from '@/features/settings/profile/dal/actorIdBySubject.read.dal'
import { readCurrentAuthUser } from '@/features/auth/adapters/authSession.adapter'
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
  invalidateActorProfileCache,
  refreshVcActorDirectory,
}) {
  if (!subjectId) throw new Error('saveProfile: subjectId missing')

  // V12A-M1: account-level session bind for the user-profile text write. `subjectId`
  // is `public.profiles.id` (= auth.users.id), session-derived at the hook but a
  // trusted param below it; re-verify it against the authenticated session BEFORE any
  // side effect (upload/payload/write) so a forged/victim subjectId cannot overwrite
  // another user's profile. User-only — the vport path is bound by the DAL
  // `owner_user_id = auth.uid()` filter and is intentionally untouched. Defense-in-depth
  // over the durable `public.profiles` UPDATE RLS boundary (12A-DB-1). Mirrors the
  // account-level session-equality precedent in recordLegalAcceptance (V12C).
  if (mode === 'user') {
    const sessionUser = await readCurrentAuthUser()
    if (!sessionUser || String(sessionUser.id) !== String(subjectId)) {
      throw new Error('saveProfile: subjectId must match the authenticated session')
    }
  }

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

  if (actorId) {
    try { refreshVcActorDirectory?.(actorId) } catch {}
  }

  // Bust the 30s profile page cache so navigation to the profile sees fresh data
  if (actorId) {
    try { invalidateActorProfileCache?.(actorId) } catch {}
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

