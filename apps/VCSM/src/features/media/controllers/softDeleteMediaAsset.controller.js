import { softDeleteMediaAssetDAL } from '@/features/media/dal/mediaAssets.softDelete.dal'
import { readMediaOwnerLinkDAL } from '@/features/media/dal/mediaAssets.ownership.read.dal'
import { readCurrentAuthUser } from '@/features/auth/adapters/authSession.adapter'

/**
 * softDeleteMediaAssetController — mark a media asset as deleted.
 *
 * Authorization (V06C-M2): session-derived, kind-agnostic ownership bind — the
 * authenticated session user must own `actorId` via vc.actor_owners (mirrors
 * createPostController). This is DEFENSE-IN-DEPTH only; the durable boundary is
 * platform.media_assets RLS (06C-DB-3 — the {public} policy — Phase 15). The
 * controller validates params, binds ownership, then delegates to the DAL.
 * Callers must import from media.adapter — not from this file directly.
 *
 * @param {{ assetId: string, actorId: string }} params
 * @returns {Promise<{ id: string, status: string, deleted_at: string, deleted_by_actor_id: string, updated_at: string }>}
 */
export async function softDeleteMediaAssetController({ assetId, actorId }) {
  if (!assetId) throw new Error('[softDeleteMediaAsset] assetId is required')
  if (!actorId) throw new Error('[softDeleteMediaAsset] actorId is required')

  // Session-derived ownership: the session user must own `actorId` (any kind)
  // before any soft-delete. Session is read via the approved auth adapter
  // (Supabase auth is forbidden in controllers/DALs).
  const user = await readCurrentAuthUser()
  if (!user) throw new Error('[softDeleteMediaAsset] Not authenticated')

  const ownerRow = await readMediaOwnerLinkDAL({ actorId, userId: user.id })
  if (!ownerRow) throw new Error('[softDeleteMediaAsset] actor not owned by session user')

  return softDeleteMediaAssetDAL(assetId, actorId)
}
