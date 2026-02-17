// ============================================================
// getProfileView.controller
// ============================================================

import { ProfileModel } from '@/features/profiles/model/ProfileModel'
import { PostModel } from '@/features/profiles/model/PostModel'

import { readActorProfileDAL } from '@/features/profiles/dal/readActorProfile.dal'
import { readFollowStateDAL } from '@/features/profiles/dal/readFollowState.dal'
import { readActorPostsDAL } from '@/features/profiles/dal/readActorPosts.dal'
import { readPostReactionsDAL } from '@/features/profiles/dal/readPostReactionsDAL'
import { readPostRoseCountsDAL } from '@/features/profiles/dal/readPostRoseCountsDAL'

export async function getProfileView({
  viewerActorId,
  profileActorId,
}) {
  /* ============================================================
     BLOCK 1 — ACTOR IDENTITY
     ============================================================ */

  const actorRow = await readActorProfileDAL(profileActorId)

  if (!actorRow || !actorRow.actor) {
    throw new Error('Actor not found')
  }

  const {
    actor,
    profile: userProfile,
    vport,
  } = actorRow

  let isFollowing = false

  if (viewerActorId) {
    try {
      const followRow = await readFollowStateDAL({
        viewerActorId,
        targetActorId: profileActorId,
      })
      isFollowing = !!followRow?.is_active
    } catch {
      isFollowing = false
    }
  }

  /* ============================================================
     BLOCK 1A — PROFILE PRESENTATION
     ============================================================ */

  let profile

  if (actor.kind === 'vport') {
    profile = {
      actorId: profileActorId,
      kind: 'vport',

      // ✅ expose vport id at root for UI (vc.vports.id)
      vportId: vport?.id ?? null,
      vport_id: vport?.id ?? null,

      // (optional) if you later include vport_type in rpc
      vportType: vport?.vport_type ?? null,
      vport_type: vport?.vport_type ?? null,

      displayName: vport?.name ?? null,
      username: vport?.slug ?? null,
      bio: vport?.bio ?? null,

      avatarUrl: vport?.avatar_url ?? '/avatar.jpg',
      bannerUrl: vport?.banner_url ?? '/default-banner.jpg',

      vport: {
        id: vport?.id,
        name: vport?.name,
        slug: vport?.slug,
        isActive: vport?.is_active ?? false,
      },

      isVport: true,
      isFollowing,
    }
  } else {
    profile = {
      ...ProfileModel(userProfile),
      actorId: profileActorId,
      kind: 'user',
      vport: null,
      isVport: false,
      isFollowing,
    }
  }

  /* ============================================================
     BLOCK 2 — POSTS (UNCHANGED)
     ============================================================ */

  let posts = []

  try {
    const rows = await readActorPostsDAL(profileActorId)

    if (rows?.length) {
      const postIds = rows.map(p => p.id)

      const reactions = await readPostReactionsDAL(postIds)
      const roses = await readPostRoseCountsDAL(postIds)

      const reactionMap = {}
      const roseMap = {}

      for (const r of reactions ?? []) {
        reactionMap[r.post_id] ??= {}
        reactionMap[r.post_id][r.reaction] =
          (reactionMap[r.post_id][r.reaction] || 0) + 1
      }

      for (const r of roses ?? []) {
        roseMap[r.post_id] =
          (roseMap[r.post_id] || 0) + r.qty
      }

      posts = rows.map(p =>
        PostModel(
          p,
          reactionMap[p.id] ?? {},
          roseMap[p.id] ?? 0
        )
      )
    }
  } catch (err) {
    console.warn('[getProfileView] posts failed', err)
    posts = []
  }

  return { profile, posts }
}
