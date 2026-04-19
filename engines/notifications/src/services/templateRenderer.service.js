// ============================================================
// Notifications Engine — Template Renderer Service
// ============================================================
// Resolves a template for an event+channel+locale, then interpolates
// variables from event payload and render context to produce final content.

import { dalFindTemplate } from '../dal/templates.read.dal.js'

/**
 * Interpolate a template string with variables.
 * Supports {{variableName}} syntax.
 *
 * @param {string|null} templateStr
 * @param {Object} vars
 * @returns {string|null}
 */
function interpolate(templateStr, vars) {
  if (!templateStr) return null
  return templateStr.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key]
    return val !== undefined && val !== null ? String(val) : ''
  })
}

/**
 * Render notification content for a recipient.
 *
 * @param {Object} params
 * @param {string} params.eventKey
 * @param {string} [params.channel]
 * @param {string} [params.locale]
 * @param {Object} params.payload — event payload
 * @param {Object} [params.context] — additional render context (sender name, etc.)
 * @param {Object} [params.trace]
 * @returns {Promise<{ templateId: string|null, title: string|null, body: string|null, ctaLabel: string|null, linkPath: string|null, imageUrl: string|null, icon: string|null, renderContext: Object }>}
 */
export async function renderNotification({ eventKey, channel = 'in_app', locale = 'en', payload = {}, context = {}, trace = null }) {
  const template = await dalFindTemplate({ eventKey, channel, locale, trace })

  // Merge payload + context into variable map
  const vars = { ...payload, ...context }

  if (!template) {
    // No template found — return bare payload-based content
    trace?.report?.({ step: 'RENDER_NO_TEMPLATE', status: 'warn', eventKey })
    return {
      templateId: null,
      title: vars.title ?? eventKey,
      body: vars.body ?? null,
      ctaLabel: vars.ctaLabel ?? null,
      linkPath: vars.linkPath ?? null,
      imageUrl: vars.imageUrl ?? null,
      icon: vars.icon ?? null,
      renderContext: vars,
    }
  }

  trace?.report?.({ step: 'RENDER_TEMPLATE_FOUND', status: 'success', templateKey: template.template_key, version: template.version })

  return {
    templateId: template.id,
    title: interpolate(template.title_template, vars) ?? vars.title ?? eventKey,
    body: interpolate(template.body_template, vars) ?? vars.body ?? null,
    ctaLabel: interpolate(template.cta_label_template, vars) ?? vars.ctaLabel ?? null,
    linkPath: template.default_link_path ? interpolate(template.default_link_path, vars) : (vars.linkPath ?? null),
    imageUrl: template.default_image_url ?? vars.imageUrl ?? null,
    icon: template.default_icon ?? vars.icon ?? null,
    renderContext: vars,
  }
}
