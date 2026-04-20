import { useEffect, useState } from 'react'

import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/state/identity/identityContext'
import {
  ctrlDeleteAccount,
  ctrlSoftDeleteVport,
  ctrlHardDeleteVport,
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
    return () => { cancelled = true }
  }, [isVport, actorId])

  const [showConfirmAccount, setShowConfirmAccount] = useState(false)
  const [busyAccount, setBusyAccount] = useState(false)
  const [errAccount, setErrAccount] = useState('')

  const [busySoft, setBusySoft] = useState(false)
  const [errSoft, setErrSoft] = useState('')

  const [busyHard, setBusyHard] = useState(false)
  const [errHard, setErrHard] = useState('')

  async function logout() {
    await logoutFromAuth()
  }

  async function deleteAccount() {
    setBusyAccount(true)
    setErrAccount('')
    try {
      await ctrlDeleteAccount()
      // Clear cached actor state so the identity engine doesn't try to
      // resume a void actor on the next session
      localStorage.removeItem('actor_kind')
      localStorage.removeItem('actor_vport_id')
      localStorage.removeItem('actor_touch')
      await logoutFromAuth()
    } catch (error) {
      setErrAccount(error?.message || 'Could not delete your account.')
    } finally {
      setBusyAccount(false)
    }
  }

  function _switchToProfile() {
    localStorage.setItem('actor_kind', 'profile')
    localStorage.removeItem('actor_vport_id')
    localStorage.setItem('actor_touch', String(Date.now()))
    window.dispatchEvent(new CustomEvent('actor:changed', { detail: { kind: 'profile', id: null } }))
  }

  async function softDeleteVport(targetVportId) {
    setBusySoft(true)
    setErrSoft('')
    try {
      if (!targetVportId) throw new Error('No VPORT selected.')
      await ctrlSoftDeleteVport({ vportId: targetVportId })
    } catch (error) {
      setErrSoft(error?.message || 'Could not deactivate the VPORT.')
    } finally {
      setBusySoft(false)
    }
  }

  async function hardDeleteVport(targetVportId) {
    setBusyHard(true)
    setErrHard('')
    try {
      if (!targetVportId) throw new Error('No VPORT selected.')
      await ctrlHardDeleteVport({ vportId: targetVportId })
      _switchToProfile()
      window.location.replace('/me')
    } catch (error) {
      setErrHard(error?.message || 'Could not permanently delete the VPORT.')
    } finally {
      setBusyHard(false)
    }
  }

  return {
    isVport,
    vportId,
    identity,
    user,
    showConfirmAccount,
    busyAccount,
    errAccount,
    busySoft,
    errSoft,
    busyHard,
    errHard,
    setShowConfirmAccount,
    logout,
    deleteAccount,
    softDeleteVport,
    hardDeleteVport,
  }
}
