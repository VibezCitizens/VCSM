// Replaces {{param}} tokens in a template string with values from params object.
export function interpolate(template, params) {
  if (!params || typeof template !== 'string') return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : `{{${key}}}`
  )
}
