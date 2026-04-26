// src/features/booking/setup.js
// ============================================================
// VCSM — Booking Engine Startup Configuration
// ============================================================
// Call setupVcsmBookingEngine() once at app startup (main.jsx)
// before any component renders.
// ============================================================

import { configureBookingEngine } from '@booking'
import { supabase } from '@/services/supabase/supabaseClient'
import { vport } from '@/services/supabase/vportClient'
import { publishVcsmNotification } from '@/features/notifications/publish'

let _configured = false

export function setupVcsmBookingEngine() {
  if (_configured) return
  _configured = true

  configureBookingEngine({
    supabaseClient: supabase,
    vportClient: vport,
    notifyFn: publishVcsmNotification,
  })
}
