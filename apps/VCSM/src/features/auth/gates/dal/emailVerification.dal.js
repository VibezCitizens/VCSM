import { supabase } from '@/services/supabase/supabaseClient'

export async function dalResendVerificationEmail({ email }) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })
  if (error) throw error
}
