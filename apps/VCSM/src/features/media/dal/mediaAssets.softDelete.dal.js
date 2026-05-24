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
 * DB UPDATE RLS enforces that the authenticated user owns the actor identified
 * by owner_actor_id. The WITH CHECK constraint on the policy additionally
 * enforces that status must be 'deleted' and deleted_by_actor_id is not null.
 * A caller cannot use this DAL to set arbitrary status values.
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
