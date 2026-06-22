// @adapter
// @feature auth
// @blastRadius high
// @publicSurface approved-auth-adapter
//
// Approved auth-session adapter (Layer Contract §2 + AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT).
//
// This is the single approved surface for controllers in OTHER features to read the
// authenticated Supabase session user. Session reads must not live in controllers
// (Supabase is forbidden above the DAL/resolver/adapter layers) and must not live in a
// DAL (auth.getUser() is forbidden inside DAL files — no-dal-auth-leak). An approved
// auth adapter is the only conflict-free home.

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Read the currently authenticated Supabase auth user.
 *
 * @returns {Promise<object|null>} the auth user, or null when there is no session
 * @throws if Supabase returns a hard error (mirrors the existing DAL session-read contract)
 */
export async function readCurrentAuthUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data?.user ?? null
}
