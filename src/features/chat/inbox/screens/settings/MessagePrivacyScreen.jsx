import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

import useMessagePrivacySettings from '@/features/chat/inbox/hooks/useMessagePrivacySettings'
import '@/features/ui/modern/module-modern.css'

function RadioRow({ title, subtitle, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
    >
      <span
        className={[
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
          selected ? 'border-indigo-300/70' : 'border-slate-300/25',
        ].join(' ')}
        aria-hidden="true"
      >
        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-indigo-200" /> : null}
      </span>

      <div className="min-w-0">
        <div className="font-medium text-slate-100">{title}</div>
        {subtitle ? <div className="truncate text-xs text-slate-400">{subtitle}</div> : null}
      </div>
    </button>
  )
}

function ToggleRow({ title, subtitle, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
    >
      <div className="min-w-0 flex-1">
        <div className="font-medium text-slate-100">{title}</div>
        {subtitle ? <div className="truncate text-xs text-slate-400">{subtitle}</div> : null}
      </div>

      <span
        className={[
          'inline-flex h-6 w-11 rounded-full border transition',
          value ? 'border-indigo-300/55 bg-indigo-400/35' : 'border-slate-300/20 bg-slate-900/70',
        ].join(' ')}
        aria-hidden="true"
      >
        <span
          className={[
            'm-[2px] block h-5 w-5 rounded-full bg-white transition',
            value ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </span>
    </button>
  )
}

export default function MessagePrivacyScreen() {
  const navigate = useNavigate()
  const { settings, setWhoCanMessage, setAllowNewMessageRequests } = useMessagePrivacySettings()

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
    <div className="module-modern-page flex h-full flex-col">
      <div className="module-modern-shell mx-auto flex h-full w-full max-w-2xl flex-col rounded-2xl">
        <header
          className="sticky top-0 z-20 border-b border-slate-300/10 bg-[#070b16]/75 backdrop-blur"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="relative flex h-14 items-center px-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="module-modern-btn module-modern-btn--ghost -ml-1 p-2 text-indigo-300"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-slate-100">
              Vox privacy
            </h1>
            <div className="ml-auto w-10" />
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <section className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-400">Who can Vox you</div>
            <div className="module-modern-card overflow-hidden rounded-2xl">
              {options.map((option, idx) => (
                <div key={option.key}>
                  <RadioRow
                    title={option.title}
                    subtitle={option.subtitle}
                    selected={who === option.key}
                    onClick={() => setWhoCanMessage(option.key)}
                  />
                  {idx !== options.length - 1 ? <div className="h-px bg-slate-300/10" /> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-400">Requests</div>
            <div className="module-modern-card overflow-hidden rounded-2xl">
              <ToggleRow
                title="Allow Vox requests"
                subtitle="If someone cannot Vox you directly, they may appear in Requests"
                value={allowRequests}
                onChange={setAllowNewMessageRequests}
              />
            </div>
            <div className="px-1 text-xs text-slate-500">
              Controls whether first-contact inbound messages can route to Requests.
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
