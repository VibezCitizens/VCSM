import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Calls auth-register-recovery to issue a server-side recovery permit.
 * Must be called while the PASSWORD_RECOVERY session is active (JWT is fresh).
 * Returns the permitId string on success; throws on failure.
 */
export async function dalRegisterRecoveryPermit() {
  const { data, error } = await supabase.functions.invoke('auth-register-recovery', {
    method: 'POST',
  })
  if (error) throw new Error(error?.message || 'Recovery permit registration failed.')
  if (typeof data?.permitId !== 'string') {
    throw new Error('No permit ID returned from recovery registration.')
  }
  return data.permitId
}

/**
 * Calls auth-reset-password-secure to validate the recovery permit
 * and update the password via the server-side Admin API.
 * Throws on validation failure or update error.
 */
export async function dalUpdatePasswordSecure({ permitId, password }) {
  const { data, error } = await supabase.functions.invoke('auth-reset-password-secure', {
    method: 'POST',
    body: { permitId, password },
  })
  if (error) throw new Error(error?.message || 'Secure password update failed.')
  if (!data?.ok) throw new Error('Password update failed.')
}
