import { softDeleteMediaAssetDAL } from '@/features/media/dal/mediaAssets.softDelete.dal'

/**
 * softDeleteMediaAssetController — mark a media asset as deleted.
 *
 * DB RLS enforces actor ownership before the UPDATE is allowed.
 * The controller validates required params and delegates to the DAL.
 * Callers must import from media.adapter — not from this file directly.
 *
 * @param {{ assetId: string, actorId: string }} params
 * @returns {Promise<{ id: string, status: string, deleted_at: string, deleted_by_actor_id: string, updated_at: string }>}
 */
export async function softDeleteMediaAssetController({ assetId, actorId }) {
  if (!assetId) throw new Error('[softDeleteMediaAsset] assetId is required')
  if (!actorId) throw new Error('[softDeleteMediaAsset] actorId is required')

  return softDeleteMediaAssetDAL(assetId, actorId)
}
