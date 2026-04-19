// ============================================================
// Notifications Engine — Templates Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const TEMPLATE_COLUMNS = `
  id, template_key, source_domain, channel, locale, version, name,
  title_template, body_template, cta_label_template,
  default_link_path, default_image_url, default_icon,
  variables, meta, is_active, created_at, updated_at
`

/**
 * Find the best matching template for a given event key, channel, and locale.
 * Lookup strategy:
 *   1. Exact match: event_key + channel + locale
 *   2. Fallback locale: event_key + channel + 'en'
 *   3. Fallback channel: event_key + 'in_app' + locale
 *   4. Base fallback: event_key + 'in_app' + 'en'
 *
 * @param {Object} params
 * @param {string} params.eventKey
 * @param {string} [params.channel]
 * @param {string} [params.locale]
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalFindTemplate({ eventKey, channel = 'in_app', locale = 'en', trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({ step: 'TEMPLATE_LOOKUP_START', status: 'start', eventKey, channel, locale })

  // Fetch all active templates for this event key to apply cascade in-memory
  const { data, error } = await supabase
    .schema('notification')
    .from('templates')
    .select(TEMPLATE_COLUMNS)
    .eq('template_key', eventKey)
    .eq('is_active', true)
    .order('version', { ascending: false })

  if (error) {
    trace?.report?.({ step: 'TEMPLATE_LOOKUP_ERROR', status: 'error', error })
    throw error
  }

  if (!data || data.length === 0) {
    trace?.report?.({ step: 'TEMPLATE_NOT_FOUND', status: 'warn', eventKey })
    return null
  }

  // Priority cascade: exact match > fallback locale > fallback channel > base
  const exact = data.find((t) => t.channel === channel && t.locale === locale)
  if (exact) return exact

  const fallbackLocale = data.find((t) => t.channel === channel && t.locale === 'en')
  if (fallbackLocale) return fallbackLocale

  const fallbackChannel = data.find((t) => t.channel === 'in_app' && t.locale === locale)
  if (fallbackChannel) return fallbackChannel

  const baseFallback = data.find((t) => t.channel === 'in_app' && t.locale === 'en')
  if (baseFallback) return baseFallback

  // Last resort: first active template
  return data[0]
}
