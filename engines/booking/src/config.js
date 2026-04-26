// ============================================================
// Booking Engine — Configuration & Dependency Injection
// ============================================================

let _config = {}

/**
 * Configure the booking engine.
 *
 * @param {Object} config
 * @param {import('@supabase/supabase-js').SupabaseClient} config.supabaseClient
 * @param {import('@supabase/supabase-js').SupabaseClient} config.vportClient  — schema-scoped to "vport"
 * @param {(payload: Object) => void} [config.notifyFn]  — fire-and-forget notification publisher
 */
export function configureBookingEngine(config) {
  _config = { ..._config, ...config }
}

export function getSupabaseClient() {
  if (!_config.supabaseClient) {
    throw new Error('[BookingEngine] supabaseClient not configured. Call configureBookingEngine() at app startup.')
  }
  return _config.supabaseClient
}

export function getVportClient() {
  if (!_config.vportClient) {
    throw new Error('[BookingEngine] vportClient not configured. Call configureBookingEngine() at app startup.')
  }
  return _config.vportClient
}

export function getNotifyFn() {
  return _config.notifyFn ?? null
}
