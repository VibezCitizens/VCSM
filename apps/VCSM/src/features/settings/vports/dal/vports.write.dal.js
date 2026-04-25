import vportSchema from '@/services/supabase/vportClient'

/**
 * Publish or unpublish a VPORT's public business card.
 * Calls vport.set_business_card_publish_state RPC — SECURITY DEFINER, ownership enforced at DB.
 */
export async function setVportBusinessCardPublishStateDAL(vportId, published) {
  if (!vportId) throw new Error('setVportBusinessCardPublishStateDAL: vportId required')

  const { data, error } = await vportSchema.rpc('set_business_card_publish_state', {
    p_vport_id: vportId,
    p_published: published,
  })

  if (error) {
    const msg = error.message || String(error)
    if (msg.includes('AUTH_REQUIRED')) throw new Error('Not authenticated')
    if (msg.includes('INVALID_INPUT')) throw new Error('Invalid input')
    if (msg.includes('VPORT_NOT_FOUND')) throw new Error('VPORT not found or not owned by you')
    throw error
  }

  return data
}
