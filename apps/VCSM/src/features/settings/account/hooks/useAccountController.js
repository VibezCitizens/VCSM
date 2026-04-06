import { useEffect, useState } from 'react'

import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/state/identity/identityContext'
import {
  ctrlDeleteAccount,
  ctrlDeleteVport,
  ctrlResolveVportIdByActorId,
} from '@/features/settings/account/controller/account.controller'

export function useAccountController() {
  const { user, logout: logoutFromAuth } = useAuth()
  const { identity } = useIdentity()

  const isVport = identity?.kind === 'vport'
  const actorId = identity?.actorId ?? null

  const [vportId, setVportId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!isVport || !actorId) {
        if (!cancelled) setVportId(null)
        return
      }

      try {
        const nextVportId = await ctrlResolveVportIdByActorId(actorId)
        if (!cancelled) setVportId(nextVportId)
      } catch (error) {
        console.error('[Account] failed to resolve vport_id from actor', error)
        if (!cancelled) setVportId(null)
      }
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

  async function logout() {
    await logoutFromAuth()
  }

  async function deleteAccount() {
    setBusyAccount(true)
    setErrAccount('')

    try {
      await ctrlDeleteAccount()
      await logoutFromAuth()
    } catch (error) {
      setErrAccount(error?.message || 'Could not delete your account.')
    } finally {
      setBusyAccount(false)
    }
  }

  async function deleteVport() {
    setBusyVport(true)
    setErrVport('')

    try {
      if (!user?.id) throw new Error('Not signed in.')
      if (!isVport) throw new Error('Not in VPORT scope.')
      if (!vportId) throw new Error('No VPORT selected.')

      await ctrlDeleteVport({ vportId, userId: user.id })

      localStorage.setItem('actor_kind', 'profile')
      localStorage.removeItem('actor_vport_id')
      localStorage.setItem('actor_touch', String(Date.now()))

      window.dispatchEvent(
        new CustomEvent('actor:changed', {
          detail: { kind: 'profile', id: null },
        })
      )

      window.location.replace('/me')
    } catch (error) {
      setErrVport(error?.message || 'Could not delete the VPORT.')
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
