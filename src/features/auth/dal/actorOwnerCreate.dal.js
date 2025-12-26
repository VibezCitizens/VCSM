import { supabase } from '@/services/supabase/supabaseClient'

export async function dalCreateActorOwner(actorId, userId) {
  const { error } = await supabase
    .schema('vc')   
    .from('actor_owners')
    .insert({
      actor_id: actorId,
      user_id: userId,
    })

  if (error) throw error
}
