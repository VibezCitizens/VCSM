const LS_PROFESSION_KEY = 'vc:professional-access:profession'
const LS_WORKSPACE_KEY = 'vc:professional-access:workspace'

function safeParseJSON(value) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function readSavedProfession(validKeys = [], fallback = 'nurse') {
  try {
    const saved = localStorage.getItem(LS_PROFESSION_KEY)
    if (validKeys.includes(saved)) return saved
  } catch {
    // noop
  }
  return fallback
}

export function writeSavedProfession(professionKey) {
  try {
    localStorage.setItem(LS_PROFESSION_KEY, professionKey)
  } catch {
    // noop
  }
}

export function readWorkspacePrefs(professionKey) {
  try {
    const payload = safeParseJSON(localStorage.getItem(LS_WORKSPACE_KEY))
    const prefs = payload?.[professionKey]
    return typeof prefs === 'object' && prefs ? prefs : null
  } catch {
    return null
  }
}

export function writeWorkspacePrefs(professionKey, prefs) {
  try {
    const payload = safeParseJSON(localStorage.getItem(LS_WORKSPACE_KEY)) ?? {}
    payload[professionKey] = { ...(payload[professionKey] ?? {}), ...prefs }
    localStorage.setItem(LS_WORKSPACE_KEY, JSON.stringify(payload))
  } catch {
    // noop
  }
}
