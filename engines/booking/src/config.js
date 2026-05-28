// ============================================================
// Booking Engine — Configuration & Dependency Injection
// ============================================================

let _config = {}
// ELEK-007 — one-call guard: configureBookingEngine must be called exactly once.
// Prevents a rogue module loaded after app startup from swapping the DB clients.
let _frozen = false

/**
 * Configure the booking engine.
 * May only be called once — subsequent calls throw.
 *
 * @param {Object} config
 * @param {import('@supabase/supabase-js').SupabaseClient} config.supabaseClient
 * @param {import('@supabase/supabase-js').SupabaseClient} config.vportClient  — schema-scoped to "vport"
 * @param {(payload: Object) => void} [config.notifyFn]  — fire-and-forget notification publisher
 */
export function configureBookingEngine(config) {
  if (_frozen) {
    throw new Error(
      '[BookingEngine] already configured — configureBookingEngine may only be called once per process.'
    )
  }
  _config = Object.freeze({ ..._config, ...config })
  _frozen = true
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
