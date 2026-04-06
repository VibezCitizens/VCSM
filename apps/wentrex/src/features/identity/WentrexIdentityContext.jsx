// src/features/identity/WentrexIdentityContext.jsx
// ============================================================
// Wentrex — Identity Context
// ------------------------------------------------------------
// Resolves the authenticated context once per session and
// makes it available to all components in the tree.
//
// Consumers:
//   useWentrexIdentity()  — full context object + loading/error state
//   useWentrexActorId()   — { actorId, organizationId, loading }
//
// The context re-resolves on SIGNED_IN and clears on SIGNED_OUT.
// ============================================================

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { resolveAuthenticatedContext } from '@identity'
import { provisionWentrexIdentity } from './controller/provisionWentrexIdentity.controller.js'
import { supabase } from '@/services/supabase/supabaseClient'

export const WentrexIdentityContext = createContext(null)

const INITIAL = { loading: true, context: null, error: null }

// Returns true when a failed resolveExisting can be recovered by running provisioning.
// Healable: records simply don't exist yet (new invited user, first-entry after admin enrolment).
// Not healable: access explicitly revoked — must stay blocked.
function _canSelfHeal(err) {
  if (err?.code === 'ACCOUNT_NOT_FOUND') return true
  if (err?.code === 'ACCESS_DENIED' && err?.accessStatus === 'none') return true
  return false
}

export function WentrexIdentityProvider({ children }) {
  const [state, setState] = useState(INITIAL)

  // Full provision + resolve — called on active login (SIGNED_IN).
  // Writes platform identity rows via the security-definer RPC, then resolves context.
  const resolve = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    provisionWentrexIdentity()
      .then((ctx) => setState({ loading: false, context: ctx, error: null }))
      .catch((err) => setState({ loading: false, context: null, error: err }))
  }, [])

  // Read-only resolve — called on session restore (INITIAL_SESSION with session).
  // Reads platform rows to rebuild context without any write side effects.
  // skipLoginRecord: true prevents resolveAuthenticatedContext from calling dalRecordLogin,
  // which would otherwise write to platform.user_app_state on every page load — including
  // the landing page (/) and login screen (/login) — causing 403 on public routes.
  //
  // Self-heal: if platform records are missing (invited user, first entry after admin creates
  // the learning actor), fall through to provisionWentrexIdentity() which creates them safely
  // via the security-definer RPC. Only heals when records are absent — never for revoked access.
  const resolveExisting = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    resolveAuthenticatedContext({ appKey: 'wentrex', skipLoginRecord: true })
      .then((ctx) => setState({ loading: false, context: ctx, error: null }))
      .catch((err) => {
        if (_canSelfHeal(err)) {
          provisionWentrexIdentity()
            .then((ctx) => setState({ loading: false, context: ctx, error: null }))
            .catch((provErr) => setState({ loading: false, context: null, error: provErr }))
        } else {
          setState({ loading: false, context: null, error: err })
        }
      })
  }, [])

  useEffect(() => {
    // Subscribe before any getSession calls to avoid the Supabase v2 race:
    // getSession() may return null on first call if called before INITIAL_SESSION fires.
    // INITIAL_SESSION fires once the session is loaded from localStorage into memory.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // [BUGSBUNNY identity-context] Auth event received
      if (import.meta.env.DEV) {
        console.log('[BUGSBUNNY identity-context] onAuthStateChange:', event, '→ session:', !!session);
      }
      if (event === 'INITIAL_SESSION') {
        if (session) {
          resolveExisting()
        } else {
          setState({ loading: false, context: null, error: null })
        }
      }
      if (event === 'SIGNED_IN')  resolve()
      if (event === 'SIGNED_OUT') setState({ loading: false, context: null, error: null })
    })

    return () => subscription?.unsubscribe?.()
  }, [resolve, resolveExisting])

  return (
    <WentrexIdentityContext.Provider value={state}>
      {children}
    </WentrexIdentityContext.Provider>
  )
}

/**
 * Access the full resolved identity context.
 *
 * @returns {{ loading: boolean, context: AuthenticatedContext|null, error: object|null }}
 */
export function useWentrexIdentity() {
  return useContext(WentrexIdentityContext) ?? INITIAL
}

/**
 * Convenience hook for screens that only need actorId and organizationId.
 *
 * @returns {{ actorId: string|null, organizationId: string|null, loading: boolean }}
 */
export function useWentrexActorId() {
  const { loading, context } = useContext(WentrexIdentityContext) ?? INITIAL

  return {
    actorId:        context?.activeActor?.actorId ?? null,
    organizationId: context?.activeActor?.meta?.organization_id ?? null,
    roleKeys:       context?.roleKeys ?? [],
    isSuspended:    context?.isSuspended ?? false,
    loading,
  }
}
