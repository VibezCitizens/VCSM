// src/features/chat/inbox/hooks/useMessagePrivacySettings.js
import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'vc.message_privacy_settings'

const DEFAULTS = {
  // what MessagePrivacyScreen expects
  whoCanMessage: 'everyone', // 'everyone' | 'following' | 'nobody'
  allowNewMessageRequests: true,
}

// optional: tolerate old keys if you had them before
function safeParse(json) {
  try {
    const v = JSON.parse(json)
    return v && typeof v === 'object' ? v : null
  } catch {
    return null
  }
}

function normalizeSettings(raw) {
  const merged = { ...DEFAULTS, ...(raw || {}) }

  // ✅ migration from older versions of this hook
  // older: whoCanMessageMe + allowRequests
  if (raw && typeof raw.whoCanMessage === 'undefined') {
    if (typeof raw.whoCanMessageMe === 'string') {
      // map old values to new set
      const v = raw.whoCanMessageMe
      merged.whoCanMessage =
        v === 'friends' ? 'following' : v === 'nobody' ? 'nobody' : 'everyone'
    }
  }

  if (raw && typeof raw.allowNewMessageRequests === 'undefined') {
    if (typeof raw.allowRequests === 'boolean') {
      merged.allowNewMessageRequests = raw.allowRequests
    }
  }

  // force types
  merged.whoCanMessage =
    merged.whoCanMessage === 'following' || merged.whoCanMessage === 'nobody'
      ? merged.whoCanMessage
      : 'everyone'

  merged.allowNewMessageRequests = !!merged.allowNewMessageRequests

  return merged
}

export default function useMessagePrivacySettings() {
  const [settings, setSettings] = useState(DEFAULTS)

  // load once
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? safeParse(raw) : null
    const normalized = normalizeSettings(parsed)

    setSettings(normalized)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }, [])

  // persist
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  // ✅ matches screen: setWhoCanMessage(value)
  const setWhoCanMessage = useCallback((value) => {
    setSettings((prev) => ({
      ...prev,
      whoCanMessage:
        value === 'following' || value === 'nobody' ? value : 'everyone',
    }))
  }, [])

  // ✅ matches screen: setAllowNewMessageRequests(boolean)
  const setAllowNewMessageRequests = useCallback((value) => {
    setSettings((prev) => ({ ...prev, allowNewMessageRequests: !!value }))
  }, [])

  return useMemo(
    () => ({
      settings,
      setSettings,
      setWhoCanMessage,
      setAllowNewMessageRequests,
    }),
    [settings, setWhoCanMessage, setAllowNewMessageRequests]
  )
}
