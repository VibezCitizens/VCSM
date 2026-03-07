import { useEffect, useState } from 'react'
import { dalGetActorPrivacy, dalSetActorPrivacy } from '../dal/visibility.dal'

export default function ProfilePrivacyToggle({ actorId }) {
  const [loading, setLoading] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState(null)

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

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-pressed={isPrivate}
        className={`settings-toggle ${isPrivate ? 'is-private' : 'is-public'} ${
          loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        <span className="settings-toggle-knob" />
      </button>

      <div className="text-[11px] text-slate-400">
        {loading ? 'Loading...' : isPrivate ? 'Private' : 'Public'}
      </div>

      {error && <div className="max-w-[180px] text-right text-[11px] text-rose-300">{error}</div>}
    </div>
  )
}
