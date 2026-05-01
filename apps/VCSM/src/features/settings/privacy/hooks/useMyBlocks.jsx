// src/features/settings/privacy/hooks/useMyBlocks.jsx
// Provider now owns only identity context (actorId + scope).
// All data fetching is delegated to useBlockedCitizens (React Query).

import React, { createContext, useContext, useMemo } from 'react'
import { useBlockedCitizens } from '@/features/settings/queries/useBlockedCitizens'

const Ctx = createContext(null)

export function MyBlocksProvider({ children, actorId, scope }) {
  const value = useMemo(() => ({ actorId, scope }), [actorId, scope])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMyBlocks() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMyBlocks must be used inside <MyBlocksProvider>')
  return useBlockedCitizens(ctx.actorId, ctx.scope)
}
