// src/features/chat/inbox/screens/settings/MessagePrivacyScreen.jsx
// ============================================================
// VoxPrivacyScreen
// ------------------------------------------------------------
// - Persisted privacy preferences (local only)
// - Foundation for later enforcement (Requests routing / blocking)
// ============================================================

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import useMessagePrivacySettings from '@/features/chat/inbox/hooks/useMessagePrivacySettings'

function RadioRow({ title, subtitle, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3"
    >
      <span
        className={[
          'w-5 h-5 rounded-full border flex items-center justify-center shrink-0',
          selected ? 'border-white/60' : 'border-white/20',
        ].join(' ')}
        aria-hidden="true"
      >
        {selected ? <span className="w-2.5 h-2.5 rounded-full bg-white" /> : null}
      </span>

      <div className="min-w-0">
        <div className="text-white font-medium">{title}</div>
        {subtitle ? (
          <div className="text-xs text-neutral-400 truncate">{subtitle}</div>
        ) : null}
      </div>
    </button>
  )
}

function ToggleRow({ title, subtitle, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3"
    >
      <div className="min-w-0 flex-1">
        <div className="text-white font-medium">{title}</div>
        {subtitle ? (
          <div className="text-xs text-neutral-400 truncate">{subtitle}</div>
        ) : null}
      </div>

      <span
        className={[
          'inline-flex w-11 h-6 rounded-full border transition',
          value ? 'bg-white/20 border-white/30' : 'bg-black/30 border-white/10',
        ].join(' ')}
        aria-hidden="true"
      >
        <span
          className={[
            'h-5 w-5 rounded-full bg-white block m-[2px] transition',
            value ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </span>
    </button>
  )
}

export default function MessagePrivacyScreen() {
  const navigate = useNavigate()
  const { settings, setWhoCanMessage, setAllowNewMessageRequests } =
    useMessagePrivacySettings()

  const who = settings?.whoCanMessage ?? 'everyone'
  const allowRequests = settings?.allowNewMessageRequests ?? true

  const options = useMemo(
    () => [
      {
        key: 'everyone',
        title: 'Everyone',
        subtitle: 'Anyone can start a new Vox with you',
      },
      {
        key: 'following',
        title: 'People you follow',
        subtitle: 'Only people you follow can start a new Vox',
      },
      {
        key: 'nobody',
        title: 'Nobody',
        subtitle: 'No one can start a new Vox (existing Vox still work)',
      },
    ],
    []
  )

  return (
    <div className="flex flex-col h-full">
      {/* HEADER (ChatHeader-style, centered title) */}
      <header
        className="
          sticky top-0 z-20
          bg-black/90 backdrop-blur
          border-b border-white/10
        "
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="relative h-14 px-3 flex items-center">
          {/* LEFT: Back */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              p-2 -ml-1 rounded-xl
              text-violet-400
              hover:bg-violet-500/15
              active:bg-violet-500/25
              transition
            "
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>

          {/* CENTER: Title */}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            Vox privacy
          </h1>

          {/* RIGHT: spacer */}
          <div className="ml-auto w-10" />
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* WHO CAN MESSAGE */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-neutral-400">
            Who can Vox you
          </div>

          <div className="rounded-2xl border border-white/10 overflow-hidden bg-neutral-900/40">
            {options.map((o, idx) => (
              <div key={o.key}>
                <RadioRow
                  title={o.title}
                  subtitle={o.subtitle}
                  selected={who === o.key}
                  onClick={() => setWhoCanMessage(o.key)}
                />
                {idx !== options.length - 1 ? (
                  <div className="h-px bg-white/10" />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* REQUESTS BEHAVIOR */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-neutral-400">
            Requests
          </div>

          <div className="rounded-2xl border border-white/10 overflow-hidden bg-neutral-900/40">
            <ToggleRow
              title="Allow Vox requests"
              subtitle="If someone can’t Vox you directly, they may appear in Requests"
              value={allowRequests}
              onChange={setAllowNewMessageRequests}
            />
          </div>

          <div className="text-xs text-neutral-500 px-1">
            This controls whether new inbound first-contact can route to Requests later.
          </div>
        </div>
      </div>
    </div>
  )
}
