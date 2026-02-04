// C:\Users\trest\OneDrive\Desktop\VCSM\src\season\lovedrop\lib\lovedropClientKey.js

const STORAGE_KEY = 'lovedrop_client_key'

export function getOrCreateLovedropClientKey() {
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
