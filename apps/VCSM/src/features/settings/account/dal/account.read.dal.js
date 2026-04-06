import vc from '@/services/supabase/vcClient'

export async function dalReadVportIdByActorId(actorId) {
  if (!actorId) return null

  const { data, error } = await vc
    .from('actors')
    .select('vport_id')
    .eq('id', actorId)
    .maybeSingle()

  if (error) throw error
  return data?.vport_id ?? null
}
