import { supabase } from '@/services/supabase/supabaseClient'

export async function dalCreateActorOwner(actorId, userId) {
  const { error } = await supabase
    .schema('vc')
    .from('actor_owners')
    .upsert(
      { actor_id: actorId, user_id: userId },
      {
        onConflict: 'actor_id,user_id',
        ignoreDuplicates: true,
      }
    )

  if (error) throw error
}
