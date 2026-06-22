// [SHARED_ACTOR_PRIMITIVE] — user-actor profile row mapper
// ============================================================
// ProfileModel (USER branch of the polymorphic profile view)
// ------------------------------------------------------------
// Source: vc.read_actor_profile → profile block
// Used by getProfileView when actor.kind === 'user'.
// Pure row mapper: no imports, no side effects.
// ============================================================

export function ProfileModel(row) {
  if (!row) return null

  return {
    displayName: row.display_name ?? null,
    username: row.username ?? null,
    bio: row.bio ?? null,

    avatarUrl: row.photo_url ?? '/avatar.jpg',
    bannerUrl: row.banner_url ?? '/default-banner.jpg',

    private: row.private ?? false,
    discoverable: row.discoverable ?? true,
    publish: row.publish ?? true,

    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    lastSeen: row.last_seen ?? null,

    followerCount: row.follower_count ?? 0,
    followingCount: row.following_count ?? 0,
  }
}
