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
