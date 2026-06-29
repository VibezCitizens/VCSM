import { supabase } from '@/services/supabase/supabaseClient'

const PLATFORM = () => supabase.schema('platform')

const SOFT_DELETE_PROJECTION = [
  'id',
  'status',
  'deleted_at',
  'deleted_by_actor_id',
  'updated_at',
].join(',')

/**
 * softDeleteMediaAssetDAL — set status = 'deleted' on one platform.media_assets row.
 *
 * Defense layers:
 *   1. App layer — this function fixes the payload to soft-delete columns only;
 *      no caller can pass arbitrary column values through this DAL.
 *   2. DB layer (column grant) — authenticated role is granted UPDATE only on
 *      (status, deleted_at, deleted_by_actor_id, updated_at).
 *   3. DB layer (RLS USING) — "actor owner can soft delete media asset" policy
 *      enforces the authenticated user owns the actor identified by owner_actor_id
 *      via vc.actor_owners.
 *   4. DB layer (RLS WITH CHECK) — the same policy's WITH CHECK enforces
 *      status = 'deleted' AND deleted_by_actor_id IS NOT NULL, so a direct
 *      REST call cannot set an arbitrary status through this policy.
 *
 * Note: media_assets_vc_owner_update ({public} role, unrestricted column UPDATE)
 * coexists on the table. Full restriction of the broader UPDATE surface is
 * deferred to Phase 6 cleanup migrations.
 *
 * @param {string} assetId          — UUID of the asset to soft-delete
 * @param {string} deletedByActorId — actorId of the authenticated actor requesting deletion
 * @returns {Promise<{ id: string, status: string, deleted_at: string, deleted_by_actor_id: string, updated_at: string }>}
 */
export async function softDeleteMediaAssetDAL(assetId, deletedByActorId) {
  if (import.meta.env?.DEV) {
    console.log('[softDeleteMediaAssetDAL] soft-deleting:', { assetId, deletedByActorId })
  }

  const now = new Date().toISOString()

  const { data, error } = await PLATFORM()
    .from('media_assets')
    .update({
      status:              'deleted',
      deleted_at:          now,
      deleted_by_actor_id: deletedByActorId,
      updated_at:          now,
    })
    .eq('id', assetId)
    .eq('owner_actor_id', deletedByActorId) // V06C-M2 defense-in-depth: only the owning actor's asset
    .select(SOFT_DELETE_PROJECTION)
    .single()

  if (import.meta.env?.DEV) {
    console.log('[softDeleteMediaAssetDAL] result:', {
      id:     data?.id    ?? null,
      status: data?.status ?? null,
      error:  error?.code  ?? null,
    })
  }

  if (error) throw error
  return data
}
