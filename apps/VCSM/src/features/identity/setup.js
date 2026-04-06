// src/features/identity/setup.js
// ============================================================
// VCSM — Identity Engine Setup
// ------------------------------------------------------------
// Call setupVcsmIdentityEngine() once at app startup (main.jsx)
// before any component renders or auth checks run.
//
// This configures the shared identity engine with:
//   - the Supabase client singleton
//   - the VCSM-specific app context resolver (queries vc.*)
// ============================================================

import { configureIdentityEngine } from '@identity'
import { createVcsmAppContextResolver } from './resolvers/vcsmIdentity.resolver.js'
import { supabase } from '@/services/supabase/supabaseClient'
import { debugLoginEvent, debugLoginError } from '@debuggers/identity'

let _configured = false

export function setupVcsmIdentityEngine() {
  if (_configured) return
  _configured = true

  configureIdentityEngine({
    supabaseClient: supabase,
    resolveAppContext: createVcsmAppContextResolver(supabase),
    debugReporter({ step, phase = 'engine', status = 'info', message = '', payload = null, error = null }) {
      if (status === 'error') {
        debugLoginError(step, error ?? new Error(message || step), {
          phase,
          message,
          payload,
        })
        return
      }

      debugLoginEvent(step, {
        phase,
        status,
        message,
        payload,
      })
    },
  })
}
