// src/model/App.model.js

/**
 * @param {Object} raw - platform.apps row
 * @returns {import('../types/index.js').DomainApp}
 */
export function AppModel(raw) {
  return {
    id:        raw.id,
    key:       raw.key,
    name:      raw.name,
    isActive:  raw.is_active,
    createdAt: raw.created_at,
  }
}
