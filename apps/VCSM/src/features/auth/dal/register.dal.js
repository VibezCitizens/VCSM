import { supabase } from '@/services/supabase/supabaseClient'

function resolveClient(override) {
  return override ?? supabase
}

export async function dalReadRegisterSession({ client } = {}) {
  const c = resolveClient(client)
  const { data, error } = await c.auth.getSession()
  if (error) throw error
  return data?.session ?? null
}

export async function dalUpdateRegisterUser({ client, email, password }) {
  const c = resolveClient(client)
  const { data, error } = await c.auth.updateUser({ email, password })
  if (error) throw error
  return data
}

export async function dalSignUpRegisterUser({ client, email, password }) {
  const c = resolveClient(client)
  const { data, error } = await c.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function dalSignOutRegisterSession({ client } = {}) {
  const c = resolveClient(client)
  const { error } = await c.auth.signOut({ scope: 'local' })
  if (error) throw error
}

export async function dalUpsertRegisterProfile({
  client,
  userId,
  email,
  createdAt,
  updatedAt,
}) {
  const c = resolveClient(client)
  const payload = {
    id: userId,
    email,
    updated_at: updatedAt,
  }
  if (createdAt) payload.created_at = createdAt

  const { error } = await c.from('profiles').upsert(payload)
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
