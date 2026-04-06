// src/features/identity/setup.js
// ============================================================
// Wentrex — Identity Engine Setup
// ------------------------------------------------------------
// Call setupWentrexIdentityEngine() once at app startup (main.jsx)
// before any component renders or auth checks run.
//
// This configures the shared identity engine with:
//   - the Supabase client singleton
//   - the Wentrex-specific app context resolver (queries learning.*)
// ============================================================

import { configureIdentityEngine } from '@identity'
import { createWentrexAppContextResolver } from './resolvers/wentrexIdentity.resolver.js'
import { supabase } from '@/services/supabase/supabaseClient'

let _configured = false

export function setupWentrexIdentityEngine() {
  if (_configured) return
  _configured = true

  configureIdentityEngine({
    supabaseClient:     supabase,
    resolveAppContext:  createWentrexAppContextResolver(supabase),
  })
}
