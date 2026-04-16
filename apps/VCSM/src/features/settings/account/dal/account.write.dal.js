import { supabase } from '@/services/supabase/supabaseClient'
import vportSchema from '@/services/supabase/vportClient'

export async function dalDeleteMyAccount() {
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw error
}

export async function dalDeleteMyVport(vportId) {
  if (!vportId) throw new Error('dalDeleteMyVport: vportId required')

  const { error } = await supabase.rpc('delete_my_vport', {
    p_vport_id: vportId,
  })

  if (error) throw error
}

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
