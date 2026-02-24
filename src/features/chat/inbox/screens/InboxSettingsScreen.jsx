import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import useVexSettings from '@/features/chat/inbox/hooks/useVexSettings'
import '@/features/ui/modern/module-modern.css'

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

function NavRow({ title, subtitle, icon, onClick, divider = true }) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300/20 bg-slate-900/70 text-sm text-slate-100">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-slate-100">{title}</div>
          {subtitle ? <div className="truncate text-xs text-slate-400">{subtitle}</div> : null}
        </div>
        <div className="ml-auto text-slate-500">{'>'}</div>
      </button>
      {divider ? <div className="h-px bg-slate-300/10" /> : null}
    </>
  )
}

export default function InboxSettingsScreen() {
  const navigate = useNavigate()
  const { settings, setHideEmptyConversations, setShowThreadPreview } = useVexSettings()

  const hideEmptyThreads = settings.hideEmptyConversations
  const showThreadPreview = settings.showThreadPreview

  const groups = useMemo(
    () => [
      {
        section: 'Preferences',
        body: (
          <div className="module-modern-card overflow-hidden rounded-2xl">
            <ToggleRow
              title="Hide empty Vox"
              subtitle="Hide Vox with no messages"
              value={hideEmptyThreads}
              onChange={setHideEmptyConversations}
            />
            <div className="h-px bg-slate-300/10" />
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
          <div className="module-modern-card overflow-hidden rounded-2xl">
            <NavRow
              title="Vox and Chat"
              subtitle="Back to settings hub"
              icon="SET"
              onClick={() => navigate('/chat/settings')}
              divider={false}
            />
          </div>
        ),
      },
    ],
    [hideEmptyThreads, navigate, setHideEmptyConversations, setShowThreadPreview, showThreadPreview]
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
              Vox
            </h1>
            <div className="ml-auto w-10" />
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          {groups.map((group) => (
            <section key={group.section} className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-slate-400">{group.section}</div>
              {group.body}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
