// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\settings\account\controller\Account.controller.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase/supabaseClient'
import vc from '@/services/supabase/vcClient'

import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/state/identity/identityContext'

export function useAccountController() {
  const { user } = useAuth()
  const { identity } = useIdentity()

  // ✅ ACTOR-FIRST: kind decides scope (no identity.vportId)
  const isVport = identity?.kind === 'vport'
  const actorId = identity?.actorId ?? null

  // ✅ internal resolution only (allowed). This is NOT identity surface.
  const [vportId, setVportId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      // only resolve when in vport scope
      if (!isVport || !actorId) {
        if (!cancelled) setVportId(null)
        return
      }

      const { data, error } = await vc
        .from('actors')
        .select('vport_id')
        .eq('id', actorId)
        .maybeSingle()

      if (error) {
        console.error('[Account] failed to resolve vport_id from actor', error)
        if (!cancelled) setVportId(null)
        return
      }

      if (!cancelled) setVportId(data?.vport_id ?? null)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [isVport, actorId])

  const [showConfirmAccount, setShowConfirmAccount] = useState(false)
  const [busyAccount, setBusyAccount] = useState(false)
  const [errAccount, setErrAccount] = useState('')

  const [showConfirmVport, setShowConfirmVport] = useState(false)
  const [busyVport, setBusyVport] = useState(false)
  const [errVport, setErrVport] = useState('')

  /* ---------------- LOGOUT ---------------- */
  async function logout() {
    await supabase.auth.signOut({ scope: 'local' })

    localStorage.removeItem('actor_kind')
    localStorage.removeItem('actor_vport_id')
    localStorage.setItem('actor_touch', String(Date.now()))

    window.dispatchEvent(
      new CustomEvent('actor:changed', {
        detail: { kind: 'profile', id: null },
      })
    )

    try {
      supabase.getChannels?.().forEach(ch => supabase.removeChannel(ch))
    } catch {}

    window.location.replace('/login')
  }

  /* ---------------- ACCOUNT DELETE ---------------- */
  async function deleteAccount() {
    setBusyAccount(true)
    setErrAccount('')

    try {
      const { error } = await supabase.rpc('delete_my_account')
      if (error) throw error

      await supabase.auth.signOut({ scope: 'local' })
      window.location.replace('/login')
    } catch (e) {
      setErrAccount(e?.message || 'Could not delete your account.')
    } finally {
      setBusyAccount(false)
    }
  }

  /* ---------------- VPORT DELETE ---------------- */
  async function deleteVport() {
    setBusyVport(true)
    setErrVport('')

    try {
      if (!user?.id) throw new Error('Not signed in.')
      if (!isVport) throw new Error('Not in VPORT scope.')
      if (!vportId) throw new Error('No VPORT selected.')

      const { error: rpcErr } = await supabase.rpc('delete_my_vport', {
        p_vport_id: vportId,
      })

      if (rpcErr) {
        const { error: delErr } = await vc
          .from('vports')
          .delete()
          .eq('id', vportId)
          .eq('owner_user_id', user.id)

        if (delErr) throw delErr
      }

      localStorage.setItem('actor_kind', 'profile')
      localStorage.removeItem('actor_vport_id')
      localStorage.setItem('actor_touch', String(Date.now()))

      window.dispatchEvent(
        new CustomEvent('actor:changed', {
          detail: { kind: 'profile', id: null },
        })
      )

      window.location.replace('/me')
    } catch (e) {
      setErrVport(e?.message || 'Could not delete the VPORT.')
    } finally {
      setBusyVport(false)
      setShowConfirmVport(false)
    }
  }

  return {
    isVport,
    user,

    showConfirmAccount,
    busyAccount,
    errAccount,

    showConfirmVport,
    busyVport,
    errVport,

    setShowConfirmAccount,
    setShowConfirmVport,

    logout,
    deleteAccount,
    deleteVport,
  }
}