import { supabase } from '@/services/supabase/supabaseClient'

export async function readOnboardingStepsDAL() {
  const { data, error } = await supabase
    .schema('vc')
    .from('onboarding_steps')
    .select('key,label,description,cta_label,cta_path,sort_order,is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function readActorOnboardingStepDAL({ actorId, stepKey }) {
  if (!actorId || !stepKey) return null

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_onboarding_steps')
    .select('step_key,status,progress,completed_at')
    .eq('actor_id', actorId)
    .eq('step_key', stepKey)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function markActorOnboardingStepCompletedDAL({ actorId, stepKey }) {
  if (!actorId || !stepKey) throw new Error('markActorOnboardingStepCompletedDAL: actorId and stepKey required')

  const now = new Date().toISOString()

  const { error } = await supabase
    .schema('vc')
    .from('actor_onboarding_steps')
    .upsert(
      {
        actor_id:          actorId,
        step_key:          stepKey,
        status:            'completed',
        progress:          1,
        completed_at:      now,
        last_evaluated_at: now,
        updated_at:        now,
      },
      { onConflict: 'actor_id,step_key' },
    )

  if (error) throw error
}
