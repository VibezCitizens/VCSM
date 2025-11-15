import toast from 'react-hot-toast'
import { vc } from '@/lib/supabaseClientVc'  // or your alias path

export async function openChatAsVport({ navigate, vportId, targetUserId }) {
  try {
    if (!vportId || !targetUserId) throw new Error('Missing IDs')

    // 1. Resolve actor ID for vport
    const { data: vportActor, error: err1 } = await vc
      .from('actors')
      .select('id')
      .eq('vport_id', vportId)
      .maybeSingle()

    if (err1 || !vportActor?.id) throw new Error('Could not resolve vport actor.')

    // 2. Resolve actor ID for target user
    const { data: targetActor, error: err2 } = await vc
      .from('actors')
      .select('id')
      .eq('profile_id', targetUserId)
      .maybeSingle()

    if (err2 || !targetActor?.id) throw new Error('Could not resolve target actor.')

    // 3. Call RPC to create/get conversation
    const { data: convId, error: convErr } = await vc.rpc('vc_get_or_create_one_to_one', {
      a1: vportActor.id,
      a2: targetActor.id,
    })

    if (convErr || !convId) throw new Error('Conversation creation failed.')

    // 4. Navigate to chat
    navigate(`/chat/${convId}`)
    return convId
  } catch (err) {
    console.error('[openChatAsVport]', err)
    toast.error(err.message || 'Chat failed.')
    return null
  }
}

export default openChatAsVport
