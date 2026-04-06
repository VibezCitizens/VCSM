import { configureChatEngine } from '@chat'
import { getActorSummariesByIdsDAL } from '@/features/actors/dal/getActorSummariesByIds.dal'
import { createWentrexConversationPolicyResolver } from '@/features/communication/policy/wentrexMessagingPolicy'
import { supabase } from '@/services/supabase/supabaseClient'
import resolveRealm from '@/shared/utils/resolveRealm'

let _configured = false

async function getActorSummariesByIds({ actorIds }) {
  try {
    const rows = await getActorSummariesByIdsDAL(actorIds)
    return { rows, error: null }
  } catch (error) {
    return { rows: [], error }
  }
}

/**
 * Wentrex actor search — queries learning.actor_profiles.
 * Returns rows in the shape the chat engine's DirectorySearchResultModel expects.
 */
async function searchActors(query, limit = 12) {
  const q = (query || '').trim()
  if (!q) return []

  const pattern = `%${q}%`

  const { data, error } = await supabase
    .schema('learning')
    .from('actor_profiles')
    .select('actor_id, display_name, full_name, avatar_url')
    .or(`display_name.ilike.${pattern},full_name.ilike.${pattern}`)
    .order('display_name', { ascending: true })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row) => ({
    actor_id:     row.actor_id,
    display_name: row.display_name || row.full_name,
    username:     null,
    photo_url:    row.avatar_url,
    kind:         'user',
  }))
}

export function setupWentrexChatEngine() {
  if (_configured) return
  _configured = true

  configureChatEngine({
    supabaseClient: supabase,
    getActorSummariesByIds,
    resolveRealm,
    resolveConversationPolicy: createWentrexConversationPolicyResolver(),
    defaultActorSource: 'learning',

    // App-provided injectable dependencies (replacing hardcoded vc.* queries in engine)
    searchActors,
    resolveActorRealmContext: () => null,   // Wentrex has no void-actor concept; always use default realm
    checkBlockRelation: () => false,        // Wentrex has no user-block system
  })
}
