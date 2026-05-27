// src/features/media/dal/resolveAppId.read.dal.js
// ============================================================
// Resolves the platform.apps UUID for the 'vcsm' app key.
// Result is cached at module level — queried once per session.
// Required because platform.media_assets.app_id is type uuid.
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

let _cachedAppId = null

export async function resolveVcsmAppIdDAL() {
  if (_cachedAppId) {
    if (import.meta.env?.DEV) console.log('[resolveVcsmAppId] cache hit')
    return _cachedAppId
  }

  if (import.meta.env?.DEV) console.log('[resolveVcsmAppId] DB query (cold)')
  const { data, error } = await supabase
    .schema('platform')
    .from('apps')
    .select('id')
    .eq('key', 'vcsm')
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  if (!data?.id) throw new Error('[resolveVcsmAppId] App "vcsm" not found or inactive in platform.apps')

  _cachedAppId = data.id
  return _cachedAppId
}
