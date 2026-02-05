// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\lib\wandersClientKey.js

const STORAGE_KEY = 'wanders_client_key'

export function getOrCreateWandersClientKey() {
  let key = null
  try {
    key = localStorage.getItem(STORAGE_KEY)
  } catch (e) {
    // ignore
  }

  if (!key) {
    key = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`
    try {
      localStorage.setItem(STORAGE_KEY, key)
    } catch (e) {
      // ignore
    }
  }

  return key
}
