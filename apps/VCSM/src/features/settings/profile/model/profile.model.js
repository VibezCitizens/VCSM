// src/features/settings/profile/model/profile.mapper.js
// ============================================================
// Profile Mapper
// - Normalizes USER + VPORT records
// - Produces a single UI-safe profile shape
// - NO React, NO DB, NO side effects
// ============================================================

const DEFAULT_BANNER = '/default-banner.jpg'

/**
 * PUBLIC VIEW MAPPER (alias)
 * Controller expects this name
 */
export function mapProfileToView(row, mode) {
  return mapProfile(row, mode)
}

/**
 * Internal dispatcher
 *
 * @param {Object} row
 * @param {'user'|'vport'} mode
 */
export function mapProfile(row, mode) {
  if (!row) return null

  if (mode === 'vport') {
    return mapVportProfile(row)
  }

  return mapUserProfile(row)
}

/* ============================================================
   USER PROFILE
   ============================================================ */

function mapUserProfile(row) {
  return {
    mode: 'user',

    // identity
    id: row.id ?? null,
    actorId: row.actor_id ?? null,

    // display
    username: row.username ?? '',
    displayName: row.display_name ?? '',
    email: row.email ?? '',
    bio: row.bio ?? '',

    // media
    photoUrl: row.photo_url ?? '',
    bannerUrl: row.banner_url || DEFAULT_BANNER,

    // flags
    isEditable: true,
  }
}

/* ============================================================
   VPORT PROFILE
   ============================================================ */

function mapVportProfile(row) {
  return {
    mode: 'vport',

    // identity
    id: row.id ?? null,
    actorId: row.actor_id ?? null,
    ownerUserId: row.owner_user_id ?? null,

    // display
    username: row.slug ?? '',
    displayName: row.name ?? '',
    email: null, // VPORTs don't expose email
    bio: row.bio ?? '',

    // media
    photoUrl: row.avatar_url ?? '',
    bannerUrl: row.banner_url || DEFAULT_BANNER,

    // flags
    isEditable: true,
  }
}

/* ============================================================
   PAYLOAD MAPPER (UI → DB)
   ============================================================ */

/**
 * Convert UI profile state into DB update payload
 *
 * @param {Object} ui
 * @param {'user'|'vport'} mode
 */
export function mapProfileUpdate(ui, mode) {
  if (!ui) return {}

  if (mode === 'vport') {
    return mapVportUpdate(ui)
  }

  return mapUserUpdate(ui)
}

function mapUserUpdate(ui) {
  return {
    display_name: ui.displayName?.trim() || null,
    bio: ui.bio?.trim() || null,
    photo_url: ui.photoUrl || null,
    banner_url: ui.bannerUrl || null,
  }
}

function mapVportUpdate(ui) {
  return {
    name: ui.displayName?.trim() || null,
    bio: ui.bio?.trim() || null,
    avatar_url: ui.photoUrl || null,
    banner_url: ui.bannerUrl || null,
  }
}
