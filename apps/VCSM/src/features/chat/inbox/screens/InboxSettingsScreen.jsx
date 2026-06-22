import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import useVexSettings from '@/features/chat/inbox/hooks/useVexSettings'
import { useTranslation } from '@i18n'
import '@/shared/styles/modern/module-modern.css'
import '@/features/chat/styles/chat-modern.css'

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

function NavRow({ title, subtitle, icon, onClick, divider = true }) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="chat-modern-settings-row flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/4 text-sm text-white">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-white">{title}</div>
          {subtitle ? <div className="truncate text-xs text-white/50">{subtitle}</div> : null}
        </div>
        <div className="ml-auto text-white/40">{'>'}</div>
      </button>
      {divider ? <div className="h-px bg-white/6" /> : null}
    </>
  )
}

export default function InboxSettingsScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settings, setHideEmptyConversations, setShowThreadPreview } = useVexSettings()

  const hideEmptyThreads = settings.hideEmptyConversations
  const showThreadPreview = settings.showThreadPreview

  const groups = useMemo(
    () => [
      {
        section: t('vox.preferences.sectionPreferences'),
        body: (
          <div className="module-modern-card overflow-hidden rounded-2xl">
            <ToggleRow
              title={t('vox.preferences.hideEmptyTitle')}
              subtitle={t('vox.preferences.hideEmptySubtitle')}
              value={hideEmptyThreads}
              onChange={setHideEmptyConversations}
            />
            <div className="h-px bg-white/6" />
            <ToggleRow
              title={t('vox.preferences.showPreviewTitle')}
              subtitle={t('vox.preferences.showPreviewSubtitle')}
              value={showThreadPreview}
              onChange={setShowThreadPreview}
            />
          </div>
        ),
      },
      {
        section: t('vox.preferences.sectionAdvanced'),
        body: (
          <div className="module-modern-card overflow-hidden rounded-2xl">
            <NavRow
              title={t('vox.preferences.advancedTitle')}
              subtitle={t('vox.preferences.advancedSubtitle')}
              icon="SET"
              onClick={() => navigate('/chat/settings')}
              divider={false}
            />
          </div>
        ),
      },
    ],
    [hideEmptyThreads, navigate, setHideEmptyConversations, setShowThreadPreview, showThreadPreview, t]
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
              {t('vox.preferences.title')}
            </h1>
            <div className="ml-auto w-10" />
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          {groups.map((group) => (
            <section key={group.section} className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-white/50">{group.section}</div>
              {group.body}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
