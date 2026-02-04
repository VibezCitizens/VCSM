// C:\Users\trest\OneDrive\Desktop\VCSM\src\season\lovedrop\controllers\ensureLovedropAnon.controller.js

import {
  createLovedropAnonIdentity,
  getLovedropAnonIdentityByClientKey,
} from '@/season/lovedrop/dal/lovedropAnon.dal'

const STORAGE_KEY = 'lovedrop_client_key'

function getOrCreateLovedropClientKey() {
  let key = null
  try {
    key = localStorage.getItem(STORAGE_KEY)
  } catch (e) {
    // ignore (blocked storage / SSR)
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

export async function ensureLovedropAnonIdentity({ clientKey }) {
  const ck = clientKey || getOrCreateLovedropClientKey()

  const existing = await getLovedropAnonIdentityByClientKey(ck)
  if (existing) return existing

  return createLovedropAnonIdentity({ clientKey: ck })
}
