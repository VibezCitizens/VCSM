import { useEffect, useState } from 'react'
import { evaluateCompleteProfileGateController } from '@/features/auth/controllers/completeProfileGate.controller'

export function useCompleteProfileGate() {
  const [state, setState] = useState({ loading: true, needsOnboarding: false })

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        const result = await evaluateCompleteProfileGateController()
        if (!alive) return

        setState({
          loading: false,
          needsOnboarding: Boolean(result?.needsOnboarding),
        })
      } catch (error) {
        console.error('[useCompleteProfileGate] failed', error)
        if (!alive) return

        setState({
          loading: false,
          needsOnboarding: false,
        })
      }
    })()

    return () => { alive = false }
  }, [])

  return state
}
