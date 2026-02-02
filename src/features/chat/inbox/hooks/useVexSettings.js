// src/features/chat/inbox/hooks/useVexSettings.js
import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'vc.vex_settings'

const DEFAULTS = {
  hideEmptyConversations: false,
  showThreadPreview: true, // ✅ Option B: preview area toggle
}

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

  // ✅ migrate older key if you previously stored showMessagePreview
  if (raw && typeof raw.showThreadPreview !== 'boolean') {
    if (typeof raw.showMessagePreview === 'boolean') {
      merged.showThreadPreview = raw.showMessagePreview
    }
  }

  merged.hideEmptyConversations = !!merged.hideEmptyConversations
  merged.showThreadPreview = !!merged.showThreadPreview

  return merged
}

export default function useVexSettings() {
  const [settings, setSettings] = useState(DEFAULTS)

  // load once (and migrate)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const rawStr = window.localStorage.getItem(STORAGE_KEY)
    const parsed = rawStr ? safeParse(rawStr) : null
    const normalized = normalizeSettings(parsed)

    setSettings(normalized)

    // ✅ write back migrated shape so it stays stable
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }, [])

  // persist
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const setHideEmptyConversations = useCallback((value) => {
    setSettings((prev) => ({ ...prev, hideEmptyConversations: !!value }))
  }, [])

  const setShowThreadPreview = useCallback((value) => {
    setSettings((prev) => ({ ...prev, showThreadPreview: !!value }))
  }, [])

  return useMemo(
    () => ({
      settings,
      setHideEmptyConversations,
      setShowThreadPreview,
    }),
    [settings, setHideEmptyConversations, setShowThreadPreview]
  )
}
