import { supabase } from '@/services/supabase/supabaseClient'
import vportSchema from '@/services/supabase/vportClient'

export async function dalSoftDeleteCitizenAccount() {
  const { data, error } = await supabase.rpc('soft_delete_citizen_account')

  if (error) {
    const msg = error.message || String(error)
    if (msg.includes('AUTH_REQUIRED'))     throw new Error('Not authenticated')
    if (msg.includes('CITIZEN_NOT_FOUND')) throw new Error('No active citizen account found')
    throw error
  }

  return data
}

export async function dalDeleteMyVport(vportId) {
  if (!vportId) throw new Error('dalDeleteMyVport: vportId required')

  const { data, error } = await vportSchema.rpc('soft_delete_vport', {
    p_vport_id: vportId,
  })

  if (error) {
    const msg = error.message || String(error)
    if (msg.includes('AUTH_REQUIRED')) throw new Error('Not authenticated')
    if (msg.includes('VPORT_NOT_FOUND_OR_UNAUTHORIZED')) throw new Error('Vport not found or not owned by you')
    throw error
  }

  return data
}

export async function dalRestoreVport(vportId) {
  if (!vportId) throw new Error('dalRestoreVport: vportId required')

  const { data, error } = await vportSchema.rpc('restore_vport', {
    p_vport_id: vportId,
  })

  if (error) {
    const msg = error.message || String(error)
    if (msg.includes('AUTH_REQUIRED')) throw new Error('Not authenticated')
    if (msg.includes('VPORT_NOT_FOUND_OR_NOT_DELETED')) throw new Error('Vport not found or not currently deleted')
    throw error
  }

  return data
}

export async function dalHardDeleteVport(vportId) {
  if (!vportId) throw new Error('dalHardDeleteVport: vportId required')

  const { data, error } = await vportSchema.rpc('hard_delete_vport', {
    p_vport_id: vportId,
  })

  if (error) {
    const msg = error.message || String(error)
    if (msg.includes('AUTH_REQUIRED')) throw new Error('Not authenticated')
    if (msg.includes('VPORT_NOT_FOUND_OR_NOT_DELETED')) throw new Error('Vport must be soft-deleted before hard delete')
    throw error
  }

  return data
}

// Deprecated — use dalDeleteMyVport (RPC) instead.
// Kept for backward compatibility; does not set deleted_at or fire actor chain logic.
export async function dalDeleteOwnedVportById({ vportId, userId }) {
  if (!vportId) throw new Error('dalDeleteOwnedVportById: vportId required')
  if (!userId) throw new Error('dalDeleteOwnedVportById: userId required')

  const { error } = await vportSchema
    .from('profiles')
    .update({ is_deleted: true })
    .eq('id', vportId)
    .eq('owner_user_id', userId)

  if (error) throw error
}
