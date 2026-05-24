import { supabase } from '@/services/supabase/supabaseClient'

export async function dalSendResetPasswordEmail({ email, redirectTo }) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
  if (error) throw error
}

export async function dalExchangeRecoveryCode(code) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) throw error
  return data?.session ?? null
}

export async function dalUpdateUserPassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  return data?.user ?? null
}

export async function dalSignOutRecoverySession() {
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw error
}

export function dalSubscribeToAuthStateChange(handler) {
  const { data: listener } = supabase.auth.onAuthStateChange(handler)
  return () => listener?.subscription?.unsubscribe?.()
}
