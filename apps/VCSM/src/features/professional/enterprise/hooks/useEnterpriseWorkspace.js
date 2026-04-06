import { useEffect, useMemo, useState } from 'react'

import { getEnterpriseSeedByProfession } from '@/features/professional/enterprise/data/enterpriseSeed.data'
import { buildEnterpriseView } from '@/features/professional/enterprise/model/buildEnterpriseView.model'
import {
  readWorkspacePrefs,
  writeWorkspacePrefs,
} from '@/features/professional/core/storage/professionalAccess.storage'

const DEFAULT_PREFS = Object.freeze({
  panel: 'overview',
  city: 'all',
  priority: 'all',
})

export default function useEnterpriseWorkspace({ professionKey }) {
  const initialPrefs = useMemo(() => {
    const saved = readWorkspacePrefs(professionKey)
    return { ...DEFAULT_PREFS, ...(saved ?? {}) }
  }, [professionKey])

  const [panel, setPanel] = useState(initialPrefs.panel)
  const [city, setCity] = useState(initialPrefs.city)
  const [priority, setPriority] = useState(initialPrefs.priority)
  const [query, setQuery] = useState('')

  useEffect(() => {
    writeWorkspacePrefs(professionKey, { panel, city, priority })
  }, [professionKey, panel, city, priority])

  const seed = useMemo(() => getEnterpriseSeedByProfession(professionKey), [professionKey])

  const view = useMemo(
    () =>
      buildEnterpriseView({
        seed,
        query,
        city,
        priority,
      }),
    [seed, query, city, priority]
  )

  const cityOptions = useMemo(() => {
    const unique = new Set((seed.incidents ?? []).map((item) => item.city).filter(Boolean))
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b))]
  }, [seed.incidents])

  return {
    panel,
    setPanel,
    city,
    setCity,
    priority,
    setPriority,
    query,
    setQuery,
    cityOptions,
    view,
  }
}
