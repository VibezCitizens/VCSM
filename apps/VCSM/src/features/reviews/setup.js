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
     * Real enforcement is DB-level: vc.is_actor_owner() in RLS policies
     * and inside reviews.upsert_neutral_review() SECURITY DEFINER.
     */
    isActorOwner: async (actorId) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return false

      const { data, error } = await supabase
        .schema('vc')
        .from('actors')
        .select('id')
        .eq('id', actorId)
        .eq('is_void', false)
        .limit(1)

      if (error || !data?.[0]) return false
      return true
    },
  })
}
