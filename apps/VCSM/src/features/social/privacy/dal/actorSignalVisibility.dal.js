import { supabase } from '@/services/supabase/supabaseClient'

// No cache — result depends on viewer's live follow status.
// Signals: 'follower_count' | 'follower_list' | 'following_list'
export async function dalCanViewActorSignal({ targetActorId, viewerActorId, signal }) {
  if (!targetActorId || !signal) return false

  const { data, error } = await supabase
    .schema('vc')
    .rpc('can_view_actor_signal', {
      p_target_actor_id: targetActorId,
      p_viewer_actor_id: viewerActorId ?? null,
      p_signal: signal,
    })

  if (error) {
    if (import.meta.env?.DEV) {
      console.error('[dalCanViewActorSignal] error', error)
    }
    return false
  }

  return Boolean(data)
}
