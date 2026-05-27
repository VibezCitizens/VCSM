// src/features/portfolio/setup.js
// ============================================================
// VCSM — Portfolio Engine Setup
// ------------------------------------------------------------
// Call setupVcsmPortfolioEngine() once at app startup (main.jsx)
// before any component renders.
// ============================================================

import { configurePortfolioEngine } from '@portfolio'
import { supabase } from '@/services/supabase/supabaseClient'

let _configured = false

// Dev-only trace store — populated by debugReporter, read by PortfolioDebugPanel
export const portfolioTraceStore = {
  events: [],
  listeners: new Set(),
  push(event) {
    this.events = [...this.events.slice(-49), event] // keep last 50
    this.listeners.forEach((fn) => fn(this.events))
  },
  subscribe(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  },
  clear() {
    this.events = []
    this.listeners.forEach((fn) => fn([]))
  },
}

export function setupVcsmPortfolioEngine() {
  if (_configured) return
  _configured = true

  configurePortfolioEngine({
    supabaseClient: supabase,

    isActorOwner: async (actorId) => {
      // PORT-V-001: verify ownership via actor_owners, not just actor existence.
      // The actor_owners_read_own RLS policy (user_id = auth.uid()) auto-scopes
      // this query to only rows owned by the authenticated user — no explicit
      // user_id filter is required; it is enforced at the DB layer.
      if (!actorId) return false
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return false

      const { data, error } = await supabase
        .schema('vc')
        .from('actor_owners')
        .select('actor_id')
        .eq('actor_id', actorId)
        .eq('is_void', false)
        .limit(1)

      if (error || !data?.[0]) return false
      return true
    },

    // Dev-only: route engine trace events to portfolioTraceStore
    debugReporter: import.meta.env.DEV
      ? (event) => {
          portfolioTraceStore.push({ ...event, ts: Date.now() })
        }
      : null,
  })
}
