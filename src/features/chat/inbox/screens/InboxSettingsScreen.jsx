// src/features/chat/inbox/screens/InboxSettingsScreen.jsx
// ============================================================
// InboxSettingsScreen (Vox preferences)
// ------------------------------------------------------------
// UX settings surface for Vox behavior.
// Only persisted, functional toggles remain.
// ============================================================

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import useVexSettings from '@/features/chat/inbox/hooks/useVexSettings'

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

function NavRow({ title, subtitle, icon, onClick, divider = true }) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center">
          <span className="text-lg">{icon}</span>
        </div>

        <div className="min-w-0">
          <div className="text-white font-medium">{title}</div>
          {subtitle ? (
            <div className="text-xs text-neutral-400 truncate">{subtitle}</div>
          ) : null}
        </div>

        <div className="ml-auto text-neutral-500">›</div>
      </button>

      {divider ? <div className="h-px bg-white/10" /> : null}
    </>
  )
}

export default function InboxSettingsScreen() {
  const navigate = useNavigate()

  const {
    settings,
    setHideEmptyConversations,
    setShowThreadPreview, // ✅ ONLY PREVIEW TOGGLE
  } = useVexSettings()

  const hideEmptyThreads = settings.hideEmptyConversations
  const showThreadPreview = settings.showThreadPreview

  const groups = useMemo(
    () => [
      {
        section: 'Preferences',
        body: (
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-neutral-900/40">
            <ToggleRow
              title="Hide empty Vox"
              subtitle="Hide Vox with no Vox"
              value={hideEmptyThreads}
              onChange={setHideEmptyConversations}
            />

            <div className="h-px bg-white/10" />

            <ToggleRow
              title="Show preview"
              subtitle="Show preview under each Vox"
              value={showThreadPreview}
              onChange={setShowThreadPreview}
            />
          </div>
        ),
      },
      {
        section: 'Advanced',
        body: (
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-neutral-900/40">
            <NavRow
              title="Vox & Chat"
              subtitle="Back to settings hub"
              icon="⚙️"
              onClick={() => navigate('/chat/settings')}
              divider={false}
            />
          </div>
        ),
      },
    ],
    [
      navigate,
      hideEmptyThreads,
      showThreadPreview,
      setHideEmptyConversations,
      setShowThreadPreview,
    ]
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
            Vox
          </h1>

          {/* RIGHT: spacer */}
          <div className="ml-auto w-10" />
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {groups.map((g) => (
          <div key={g.section} className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-neutral-400">
              {g.section}
            </div>
            {g.body}
          </div>
        ))}
      </div>
    </div>
  )
}
