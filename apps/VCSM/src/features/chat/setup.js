// src/features/chat/setup.js
// ============================================================
// VCSM Chat Engine — Startup Configuration
// ============================================================
// Wires VCSM-specific dependencies into the shared chat engine
// via dependency injection. Must be called once before render.
//
// This follows the same pattern as Wentrex:
//   apps/wentrex/src/features/communication/setup.js
// ============================================================

import { configureChatEngine } from '@chat'
import { hydrateAndReturnSummaries } from '@hydration'
import { supabase } from '@/services/supabase/supabaseClient'
import { resolveRealm } from '@/shared/utils/resolveRealm'
import { useIdentitySelectionStore } from '@/state/identity/identitySelection.store'
import {
  normalizeHandleTerm,
  toContainsPattern,
  isUuid,
} from '@/services/supabase/postgrestSafe'

let _configured = false

/**
 * Wrap the hydration engine's hydrateAndReturnSummaries:
 * - Fetches actor summaries via canonical RPC
 * - Also writes results into the global Zustand actor store
 * - Returns { rows, error } for the chat engine's internal use
 */
async function getActorSummariesByIds({ actorIds }) {
  try {
    return await hydrateAndReturnSummaries({ actorIds })
  } catch (error) {
    return { rows: [], error }
  }
}

/**
 * App-provided actor search for the chat engine directory.
 * Uses identity.search_actor_directory RPC — returns rows matching the engine's
 * DirectorySearchResultModel shape.
 */
async function searchActors(query, limit = 12) {
  const needle = (query || '').replace(/^@/, '').trim()
  if (!needle) return []

  const viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null

  const { data, error } = await supabase
    .schema('identity')
    .rpc('search_actor_directory', {
      p_viewer_domain: 'vc',
      p_viewer_actor_id: viewerActorId,
      p_query: needle,
      p_filter: 'all',
      p_limit: limit,
      p_offset: 0,
    })

  if (error) throw error

  return (Array.isArray(data) ? data : []).map((row) => ({
    actor_id:     row.actor_id,
    display_name: row.display_name ?? null,
    username:     row.username ?? null,
    photo_url:    row.avatar_url ?? null,
    kind:         row.actor_kind ?? 'user',
  }))
}

/**
 * App-provided actor realm context resolver.
 * Returns { id, is_void } for a given actorId so the engine can
 * determine the chat realm without querying vc.* directly.
 */
async function resolveActorRealmContext({ actorId }) {
  if (!actorId) return null
  try {
    const { data, error } = await supabase
      .schema('vc')
      .from('actors')
      .select('id,is_void')
      .eq('id', actorId)
      .maybeSingle()
    if (error) throw error
    return data ?? null
  } catch {
    return null
  }
}

/**
 * App-provided block relation check.
 * Returns true if a block exists in either direction between two actors.
 */
async function checkBlockRelation({ actorA, actorB }) {
  if (!actorA || !actorB || actorA === actorB || !isUuid(actorA) || !isUuid(actorB)) {
    return false
  }
  try {
    const { data, error } = await supabase
      .schema('moderation')
      .from('blocks')
      .select('blocker_actor_id,blocked_actor_id')
      .eq('status', 'active')
      .or(
        `and(blocker_actor_id.eq.${actorA},blocked_actor_id.eq.${actorB}),and(blocker_actor_id.eq.${actorB},blocked_actor_id.eq.${actorA})`
      )
      .limit(2)
    if (error) throw error
    return Array.isArray(data) && data.length > 0
  } catch {
    return false
  }
}

export function setupVcsmChatEngine() {
  if (_configured) return
  _configured = true

  configureChatEngine({
    supabaseClient: supabase,
    getActorSummariesByIds,
    resolveRealm,
    defaultActorSource: 'vc',

    // App-provided injectable dependencies
    searchActors,
    resolveActorRealmContext,
    checkBlockRelation,

    // Shared string utilities (used by engine search/directory)
    normalizeHandleTerm,
    toContainsPattern,
    isUuid,
  })
}
