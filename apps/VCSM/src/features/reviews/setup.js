// src/features/reviews/setup.js
// ============================================================
// VCSM — Reviews Engine Setup
// ------------------------------------------------------------
// Call setupVcsmReviewsEngine() once at app startup (main.jsx)
// before any component renders.
//
// Configures the shared reviews engine with:
//   - the Supabase client singleton
//   - actor ownership check (session-based pre-guard; DB enforces real ownership)
// ============================================================

import { configureReviewsEngine } from '@reviews'
import { supabase } from '@/services/supabase/supabaseClient'

let _configured = false

export function setupVcsmReviewsEngine() {
  if (_configured) return
  _configured = true

  configureReviewsEngine({
    supabaseClient: supabase,

    /**
     * Client-side actor ownership pre-check.
     *
     * Queries vc.actor_owners, not vc.actors.
     * The actor_owners_read_own RLS policy enforces user_id = auth.uid() at the
     * DB layer — no explicit user_id filter is needed here. If a row is returned,
     * the authenticated session user owns the actor. If not (RLS blocks it),
     * they don't.
     *
     * Real enforcement is also DB-level inside reviews.upsert_neutral_review()
     * SECURITY DEFINER — this is a defense-in-depth pre-guard, not the sole gate.
     *
     * REV-V-001: fixed — previous version checked actor existence (vc.actors),
     * not actor ownership (vc.actor_owners), allowing any authenticated user
     * to pass the check for any non-void actor.
     */
    isActorOwner: async (actorId) => {
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
  })
}
