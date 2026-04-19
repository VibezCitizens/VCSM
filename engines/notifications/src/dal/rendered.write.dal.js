// ============================================================
// Notifications Engine — Rendered Write DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Upsert rendered notification content for a recipient.
 * Uses recipient_id as PK — one rendered row per recipient.
 *
 * @param {Object} params
 * @param {string} params.recipientId
 * @param {string|null} [params.templateId]
 * @param {string} [params.locale]
 * @param {string|null} [params.title]
 * @param {string|null} [params.body]
 * @param {string|null} [params.ctaLabel]
 * @param {string|null} [params.linkPath]
 * @param {string|null} [params.imageUrl]
 * @param {string|null} [params.icon]
 * @param {Object} [params.renderContext]
 * @param {Object} [params.trace]
 * @returns {Promise<Object>}
 */
export async function dalUpsertRendered({
  recipientId,
  templateId = null,
  locale = 'en',
  title = null,
  body = null,
  ctaLabel = null,
  linkPath = null,
  imageUrl = null,
  icon = null,
  renderContext = {},
  trace = null,
}) {
  const supabase = getSupabaseClient()

  trace?.report?.({ step: 'RENDERED_UPSERT_START', status: 'start' })

  const { data, error } = await supabase
    .schema('notification')
    .rpc('upsert_rendered', {
      p_recipient_id: recipientId,
      p_template_id: templateId,
      p_locale: locale,
      p_title: title,
      p_body: body,
      p_cta_label: ctaLabel,
      p_link_path: linkPath,
      p_image_url: imageUrl,
      p_icon: icon,
      p_render_context: renderContext,
    })
    .single()

  if (error) {
    trace?.report?.({ step: 'RENDERED_UPSERT_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'RENDERED_UPSERT_SUCCESS', status: 'success' })
  return data
}

/**
 * Fetch rendered content by recipient IDs.
 *
 * @param {Object} params
 * @param {string[]} params.recipientIds
 * @param {Object} [params.trace]
 * @returns {Promise<Object[]>}
 */
export async function dalGetRenderedByRecipientIds({ recipientIds, trace = null }) {
  if (!recipientIds || recipientIds.length === 0) return []

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('notification')
    .from('rendered')
    .select(`
      recipient_id, template_id, locale, title, body,
      cta_label, link_path, image_url, icon,
      render_context, rendered_at, updated_at
    `)
    .in('recipient_id', recipientIds)

  if (error) {
    trace?.report?.({ step: 'RENDERED_READ_ERROR', status: 'error', error })
    throw error
  }

  return data ?? []
}
