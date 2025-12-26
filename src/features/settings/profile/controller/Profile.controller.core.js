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

  let nextPhotoUrl = draft.photoUrl || null
  let nextBannerUrl = draft.bannerUrl || null

  if (draft.__avatarFile) {
    const uploaded = await uploads.uploadAvatar(draft.__avatarFile)
    if (uploaded) nextPhotoUrl = uploaded
  }

  if (draft.__bannerFile) {
    const uploaded = await uploads.uploadBanner(draft.__bannerFile)
    if (uploaded) nextBannerUrl = uploaded
  }

  const normalizedUi = {
    ...draft,
    photoUrl: nextPhotoUrl || null,
    bannerUrl: nextBannerUrl || null,
  }

  const payload = mapProfileUpdate(normalizedUi, mode)

  // 🔥 READ DB CONFIRMATION
  const dbRow = await updateProfile(subjectId, mode, payload)

  // 🔥 RETURN DB-AS-TRUTH
  return {
    ...draft,
    photoUrl: dbRow?.photo_url ?? nextPhotoUrl ?? '',
    bannerUrl: dbRow?.banner_url ?? nextBannerUrl ?? '',
    __avatarFile: null,
    __bannerFile: null,
  }
}

