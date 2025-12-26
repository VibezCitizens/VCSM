import { useEffect, useState } from 'react'
import {
  dalGetActorPrivacy,
  dalSetActorPrivacy,
} from '../dal/visibility.dal'

/**
 * ============================================================
 * ProfilePrivacyToggle (ACTOR-SSOT)
 * ------------------------------------------------------------
 * Controls public / private visibility for an actor
 *
 * Authority:
 * - actorId (vc.actors.id)
 *
 * Storage:
 * - vc.actor_privacy_settings
 *
 * Notes:
 * - Row may not exist (defaults to public)
 * - No userId / vportId / scope branching
 * ============================================================
 */

export default function ProfilePrivacyToggle({ actorId }) {
  const [loading, setLoading] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState(null)

  // ------------------------------------------------------------
  // LOAD CURRENT STATE
  // ------------------------------------------------------------
  useEffect(() => {
    let alive = true

    async function load() {
      if (!actorId) return

      setLoading(true)
      setError(null)

      try {
        const value = await dalGetActorPrivacy(actorId)
        if (!alive) return
        setIsPrivate(value)
      } catch (e) {
        if (!alive) return
        setError(e.message || String(e))
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [actorId])

  // ------------------------------------------------------------
  // TOGGLE HANDLER
  // ------------------------------------------------------------
  async function toggle() {
    if (loading || !actorId) return

    setLoading(true)
    setError(null)

    try {
      const next = !isPrivate
      await dalSetActorPrivacy(actorId, next)
      setIsPrivate(next)
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition
          ${isPrivate ? 'bg-red-600' : 'bg-zinc-600'}
          ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-pressed={isPrivate}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition
            ${isPrivate ? 'translate-x-5' : 'translate-x-1'}
          `}
        />
      </button>

      <div className="text-[11px] text-zinc-400">
        {loading
          ? 'Loading…'
          : isPrivate
          ? 'Private'
          : 'Public'}
      </div>

      {error && (
        <div className="text-[11px] text-red-400 max-w-[180px] text-right">
          {error}
        </div>
      )}
    </div>
  )
}
