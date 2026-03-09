import { supabase } from '@/services/supabase/supabaseClient'
import { getWandersSupabase } from '@/features/wanders/adapters/services/wandersSupabaseClient.adapter'

function resolveAuthClient(isWandersFlow) {
  return isWandersFlow ? getWandersSupabase() : supabase
}

export async function dalReadRegisterSession({ isWandersFlow }) {
  const client = resolveAuthClient(isWandersFlow)
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return data?.session ?? null
}

export async function dalUpdateRegisterUser({ isWandersFlow, email, password }) {
  const client = resolveAuthClient(isWandersFlow)
  const { data, error } = await client.auth.updateUser({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function dalSignUpRegisterUser({ isWandersFlow, email, password }) {
  const client = resolveAuthClient(isWandersFlow)
  const { data, error } = await client.auth.signUp({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function dalSignOutRegisterSession({ isWandersFlow }) {
  const client = resolveAuthClient(isWandersFlow)
  const { error } = await client.auth.signOut({ scope: 'local' })
  if (error) throw error
}

export async function dalUpsertRegisterProfile({
  isWandersFlow,
  userId,
  email,
  createdAt,
  updatedAt,
}) {
  const client = resolveAuthClient(isWandersFlow)
  const payload = {
    id: userId,
    email,
    updated_at: updatedAt,
  }
  if (createdAt) payload.created_at = createdAt

  const { error } = await client.from('profiles').upsert(payload)
  if (error) throw error
}

export async function dalMirrorWandersSessionToPrimary({
  accessToken,
  refreshToken,
}) {
  const { error: setSessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  if (setSessionError) throw setSessionError

  const { error: warmError } = await supabase.auth.getSession()
  if (warmError) throw warmError
}
