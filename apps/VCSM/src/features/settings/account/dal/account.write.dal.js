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

/**
 * Permanently deletes the citizen's app/domain data AND their Supabase Auth user.
 * Delegates to the delete-citizen-account Edge Function which holds the service role key.
 * Ordering: app data first, auth user second.
 * If app data deletion fails the auth user is untouched.
 */
export async function dalDeleteCitizenAccountFull() {
  const { data, error } = await supabase.functions.invoke('delete-citizen-account', {
    method: 'POST',
  })

  if (error) {
    throw new Error(error?.message || 'Could not delete account.')
  }

  if (data?.code === 'AUTH_DELETE_FAILED') {
    const err = new Error(data.error || 'Auth deletion failed after account data was removed. Contact support.')
    err.code = 'AUTH_DELETE_FAILED'
    throw err
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

