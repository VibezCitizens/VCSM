// ============================================================
// Notifications Engine — Template Model
// ============================================================

/**
 * Transform a raw DB row from notification.templates into a domain object.
 *
 * @param {Object} row
 * @returns {import('../types/index.js').Template}
 */
export function TemplateModel(row) {
  return {
    id: row.id,
    templateKey: row.template_key,
    sourceDomain: row.source_domain,
    channel: row.channel,
    locale: row.locale ?? 'en',
    version: row.version ?? 1,
    name: row.name,
    titleTemplate: row.title_template ?? null,
    bodyTemplate: row.body_template ?? null,
    ctaLabelTemplate: row.cta_label_template ?? null,
    defaultLinkPath: row.default_link_path ?? null,
    defaultImageUrl: row.default_image_url ?? null,
    defaultIcon: row.default_icon ?? null,
    variables: row.variables ?? [],
    meta: row.meta ?? {},
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
