// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\lib\wandersClientKey.js

const STORAGE_KEY = 'wanders_client_key'

export function getOrCreateWandersClientKey() {
  let key = null
  try {
    key = localStorage.getItem(STORAGE_KEY)
  } catch (_ERR) {
    // ignore
    void _ERR
  }

  if (!key) {
    key = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`
    try {
      localStorage.setItem(STORAGE_KEY, key)
    } catch (_ERR) {
      // ignore
      void _ERR
    }
  }

  return key
}
