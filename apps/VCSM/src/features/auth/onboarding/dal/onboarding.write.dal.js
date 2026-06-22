import { supabase } from '@/services/supabase/supabaseClient'

export async function upsertCompletedOnboardingProfileDAL({
  profileId,
  displayName,
  username,
  birthdate,
  age,
  isAdult,
  sex,
  updatedAt,
}) {
  const { error } = await supabase.from('profiles').upsert({
    id: profileId,
    display_name: displayName,
    username,
    birthdate,
    age,
    is_adult: isAdult,
    sex,
    publish: true,
    discoverable: true,
    updated_at: updatedAt,
  })

  if (error) throw error
}
