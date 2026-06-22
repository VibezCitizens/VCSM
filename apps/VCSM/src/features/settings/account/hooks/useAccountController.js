import { useState } from 'react'

import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { useActorSummary } from '@/state/actors/useActorSummary'
import { useAccountSettings } from '@/features/settings/account/hooks/useAccountSettings'
import {
  ctrlDeleteAccount,
  ctrlSoftDeleteVport,
  ctrlHardDeleteVport,
  ctrlRestoreVport,
} from '@/features/settings/account/controller/account.controller'

export function useAccountController() {
  const { user, logout: logoutFromAuth, logoutAllSessions: logoutAllSessionsFromAuth } = useAuth()
  const { identity, availableActors, switchActor, refreshAvailableActors } = useIdentity()
  const { displayName, username: handle, avatar: avatarUrl } = useActorSummary(identity?.actorId)

  const isVport = identity?.kind === 'vport'
  const actorId = identity?.actorId ?? null

  // React Query replaces the useEffect vportId resolution
  const { data: vportId = null } = useAccountSettings({ actorId, isVport })

  const [showConfirmAccount, setShowConfirmAccount] = useState(false)
  const [busyAccount, setBusyAccount] = useState(false)
  const [errAccount, setErrAccount] = useState('')

  const [busySoft, setBusySoft] = useState(false)
  const [errSoft, setErrSoft] = useState('')

  const [busyHard, setBusyHard] = useState(false)
  const [errHard, setErrHard] = useState('')

  const [busyRestore, setBusyRestore] = useState(false)
  const [errRestore, setErrRestore] = useState('')

  const [busyLogoutAll, setBusyLogoutAll] = useState(false)
  const [errLogoutAll, setErrLogoutAll] = useState('')

  async function logout() {
    await logoutFromAuth()
  }

  async function logoutAllSessions() {
    setBusyLogoutAll(true)
    setErrLogoutAll('')
    try {
      await logoutAllSessionsFromAuth()
    } catch (error) {
      setErrLogoutAll(error?.message || 'Could not sign out all sessions.')
      setBusyLogoutAll(false)
    }
  }

  async function deleteAccount() {
    setBusyAccount(true)
    setErrAccount('')
    try {
      await ctrlDeleteAccount()
      localStorage.removeItem('actor_kind')
      localStorage.removeItem('actor_vport_id')
      localStorage.removeItem('actor_touch')
      await logoutFromAuth()
    } catch (error) {
      // AUTH_DELETE_FAILED: app data was deleted but auth user cleanup failed.
      // Still force logout — user has no valid app state to return to.
      if (error?.code === 'AUTH_DELETE_FAILED') {
        localStorage.removeItem('actor_kind')
        localStorage.removeItem('actor_vport_id')
        localStorage.removeItem('actor_touch')
        try { await logoutFromAuth() } catch (_) {}
      } else {
        setErrAccount(error?.message || 'Could not delete your account.')
      }
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
      if (isVport) {
        const citizenActor = availableActors.find((a) => a.actorKind === 'user')
        if (citizenActor?.actorId) {
          const result = await switchActor(citizenActor.actorId, 'soft_delete_vport')
          if (!result?.success) {
            _switchToProfile()
            window.location.replace('/me')
          }
        } else {
          _switchToProfile()
          window.location.replace('/me')
        }
      }
      return true
    } catch (error) {
      setErrSoft(error?.message || 'Could not deactivate the VPORT.')
      return false
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

  async function restoreVport(targetVportId) {
    setBusyRestore(true)
    setErrRestore('')
    if (import.meta.env.DEV) console.log('[restore:start]', { surface: 'account_tab', vportId: targetVportId })
    try {
      if (!targetVportId) throw new Error('No VPORT selected.')
      await ctrlRestoreVport({ vportId: targetVportId })
      refreshAvailableActors?.()
      if (import.meta.env.DEV) console.log('[restore:success]', { surface: 'account_tab', vportId: targetVportId })
      return true
    } catch (error) {
      if (import.meta.env.DEV) console.log('[restore:error]', { surface: 'account_tab', vportId: targetVportId, error: error?.message })
      setErrRestore(error?.message || 'Could not restore the VPORT.')
      return false
    } finally {
      setBusyRestore(false)
    }
  }

  return {
    isVport,
    vportId,
    identity,
    displayName,
    avatarUrl,
    handle,
    user,
    showConfirmAccount,
    busyAccount,
    errAccount,
    busySoft,
    errSoft,
    busyHard,
    errHard,
    busyRestore,
    errRestore,
    busyLogoutAll,
    errLogoutAll,
    setShowConfirmAccount,
    logout,
    logoutAllSessions,
    deleteAccount,
    softDeleteVport,
    hardDeleteVport,
    restoreVport,
  }
}
