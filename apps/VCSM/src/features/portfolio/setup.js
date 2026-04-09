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

export function setupVcsmPortfolioEngine() {
  if (_configured) return
  _configured = true

  configurePortfolioEngine({
    supabaseClient: supabase,

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
