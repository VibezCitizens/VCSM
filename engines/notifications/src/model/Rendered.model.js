// ============================================================
// Notifications Engine — Rendered Notification Model
// ============================================================

/**
 * Transform a raw DB row from notification.rendered into a domain object.
 *
 * @param {Object} row
 * @returns {import('../types/index.js').RenderedNotification}
 */
export function RenderedModel(row) {
  return {
    recipientId: row.recipient_id,
    templateId: row.template_id ?? null,
    locale: row.locale ?? 'en',
    title: row.title ?? null,
    body: row.body ?? null,
    ctaLabel: row.cta_label ?? null,
    linkPath: row.link_path ?? null,
    imageUrl: row.image_url ?? null,
    icon: row.icon ?? null,
    renderContext: row.render_context ?? {},
    renderedAt: row.rendered_at,
    updatedAt: row.updated_at,
  }
}
