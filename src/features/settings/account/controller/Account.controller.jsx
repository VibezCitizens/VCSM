import { useState } from 'react'
import { supabase } from '@/services/supabase/supabaseClient'
import vc from '@/services/supabase/vcClient'

import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/state/identity/identityContext'

export function useAccountController() {
  const { user } = useAuth()
  const { identity } = useIdentity()

  const isVport = identity?.kind === 'vport' && !!identity?.vportId
  const vportId = identity?.vportId ?? null

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
