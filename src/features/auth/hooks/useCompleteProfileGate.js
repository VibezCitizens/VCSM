import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase/supabaseClient'
import { ensureProfileShell } from '../controllers/profileOnboarding.controller'

export function useCompleteProfileGate() {
  const [state, setState] = useState({ loading: true, needsOnboarding: false })

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!data?.user) {
        alive && setState({ loading: false, needsOnboarding: false })
        return
      }

      const result = await ensureProfileShell(data.user)
      alive && setState({ loading: false, ...result })
    })()

    return () => { alive = false }
  }, [])

  return state
}
