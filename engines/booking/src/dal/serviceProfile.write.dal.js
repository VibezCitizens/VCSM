import { getSupabaseClient } from '../config.js'

const SERVICE_PROFILE_SELECT = [
  'service_id', 'duration_minutes', 'padding_before_minutes', 'padding_after_minutes',
  'booking_mode', 'max_concurrent', 'is_bookable', 'price_cents', 'currency_code',
  'created_at', 'updated_at',
].join(',')

function normalizeIds(ids) {
  return [...new Set((Array.isArray(ids) ? ids : []).filter(Boolean).map(String))]
}

function normalizeDuration(value, fallback = 30) {
  const m = Math.floor(Number(value))
  if (!Number.isFinite(m) || m < 5) return fallback
  return Math.min(240, m)
}

export async function dalSaveServiceProfileDurationsByServiceIds({ serviceIds, durationMinutes }) {
  const ids = normalizeIds(serviceIds)
  if (!ids.length) throw new Error('BookingEngine: serviceIds are required')

  const duration = normalizeDuration(durationMinutes, 30)
  const supabase = getSupabaseClient()

  const { data: existing, error: existingErr } = await supabase
    .schema('vc')
    .from('booking_service_profiles')
    .select('service_id')
    .in('service_id', ids)

  if (existingErr) throw existingErr

  const existingSet = new Set((Array.isArray(existing) ? existing : []).map((r) => String(r.service_id)))

  let updated = []
  const existingIds = ids.filter((id) => existingSet.has(id))
  if (existingIds.length) {
    const { data, error } = await supabase
      .schema('vc')
      .from('booking_service_profiles')
      .update({ duration_minutes: duration })
      .in('service_id', existingIds)
      .select(SERVICE_PROFILE_SELECT)
    if (error) throw error
    updated = Array.isArray(data) ? data : []
  }

  let inserted = []
  const missingIds = ids.filter((id) => !existingSet.has(id))
  if (missingIds.length) {
    const rows = missingIds.map((service_id) => ({
      service_id,
      duration_minutes: duration,
      padding_before_minutes: 0,
      padding_after_minutes: 0,
      booking_mode: 'appointment',
      max_concurrent: 1,
      is_bookable: true,
    }))
    const { data, error } = await supabase
      .schema('vc')
      .from('booking_service_profiles')
      .insert(rows)
      .select(SERVICE_PROFILE_SELECT)
    if (error) throw error
    inserted = Array.isArray(data) ? data : []
  }

  const byId = new Map([...updated, ...inserted].filter(Boolean).map((r) => [String(r.service_id), r]))
  return ids.map((id) => byId.get(id)).filter(Boolean)
}
