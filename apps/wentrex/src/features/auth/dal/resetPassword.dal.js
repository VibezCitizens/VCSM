import { supabase } from '@/services/supabase/supabaseClient'

export async function dalSendResetPasswordEmail({ email, redirectTo }) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
  if (error) throw error
}
