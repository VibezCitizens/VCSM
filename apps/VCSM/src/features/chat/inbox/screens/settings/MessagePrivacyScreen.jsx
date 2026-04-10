import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

import useMessagePrivacySettings from '@/features/chat/inbox/hooks/useMessagePrivacySettings'
import '@/features/ui/modern/module-modern.css'
import '@/features/chat/styles/chat-modern.css'

function RadioRow({ title, subtitle, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="chat-modern-settings-row flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
    >
      <span
        className={[
          'chat-modern-radio',
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
          selected ? 'border-purple-300/45' : 'border-white/12',
        ].join(' ')}
        aria-hidden="true"
      >
        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-purple-200" /> : null}
      </span>

      <div className="min-w-0">
        <div className="font-medium text-white">{title}</div>
        {subtitle ? <div className="truncate text-xs text-white/50">{subtitle}</div> : null}
      </div>
    </button>
  )
}

function ToggleRow({ title, subtitle, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="chat-modern-settings-row flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
    >
      <div className="min-w-0 flex-1">
        <div className="font-medium text-white">{title}</div>
        {subtitle ? <div className="truncate text-xs text-white/50">{subtitle}</div> : null}
      </div>

      <span
        className={[
          'chat-modern-toggle',
          'inline-flex h-6 w-11 rounded-full border transition',
          value ? 'border-purple-300/35 bg-purple-400/25' : 'border-white/12 bg-white/4',
        ].join(' ')}
        aria-hidden="true"
      >
        <span
          className={[
            'chat-modern-toggle-knob',
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
    <div className="module-modern-page chat-modern-page flex h-full flex-col">
      <div className="module-modern-shell chat-modern-shell mx-auto flex h-full w-full max-w-2xl flex-col rounded-2xl">
        <header
          className="chat-modern-sticky-header sticky top-0 z-20 border-b border-white/8 bg-[#070b16]/75 backdrop-blur"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="relative flex h-14 items-center px-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="-ml-1 p-2 text-purple-300 transition hover:text-purple-300"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
              Vox privacy
            </h1>
            <div className="ml-auto w-10" />
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <section className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-white/50">Who can Vox you</div>
            <div className="module-modern-card overflow-hidden rounded-2xl">
              {options.map((option, idx) => (
                <div key={option.key}>
                  <RadioRow
                    title={option.title}
                    subtitle={option.subtitle}
                    selected={who === option.key}
                    onClick={() => setWhoCanMessage(option.key)}
                  />
                  {idx !== options.length - 1 ? <div className="h-px bg-white/6" /> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-white/50">Requests</div>
            <div className="module-modern-card overflow-hidden rounded-2xl">
              <ToggleRow
                title="Allow Vox requests"
                subtitle="If someone cannot Vox you directly, they may appear in Requests"
                value={allowRequests}
                onChange={setAllowNewMessageRequests}
              />
            </div>
            <div className="px-1 text-xs text-white/40">
              Controls whether first-contact inbound messages can route to Requests.
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
