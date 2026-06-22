import { supabase } from '@/services/supabase/supabaseClient'

const STEP_KEY = 'welcome_feed_card'

export async function readWelcomeFeedCardStateDAL({ actorId }) {
  if (!actorId) return null

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_onboarding_steps')
    .select('step_key,status,progress,completed_at')
    .eq('actor_id', actorId)
    .eq('step_key', STEP_KEY)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function markWelcomeFeedCardSeenDAL({ actorId }) {
  if (!actorId) throw new Error('markWelcomeFeedCardSeenDAL: actorId required')

  const now = new Date().toISOString()

  const { error } = await supabase
    .schema('vc')
    .from('actor_onboarding_steps')
    .upsert(
      {
        actor_id:           actorId,
        step_key:           STEP_KEY,
        status:             'completed',
        progress:           1,
        completed_at:       now,
        last_evaluated_at:  now,
        updated_at:         now,
        meta:               { source: 'welcome_feed_card' },
      },
      { onConflict: 'actor_id,step_key' },
    )

  if (error) throw error
}
