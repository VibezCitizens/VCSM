import { useTranslation } from '@i18n'

const SECTION_KEYS = [
  { key: 'notifications', tKey: 'notifications.header.tabNotifications' },
  { key: 'appointments',  tKey: 'notifications.header.tabAppointments'  },
]

export default function NotificationsHeader({
  unreadCount,
  onMarkAllSeen,
  activeSection,
  onSectionChange,
  showAppointments,
}) {
  const { t } = useTranslation()

  const pageTitle = showAppointments
    ? t('notifications.header.title')
    : t('notifications.header.vportTitle')

  const sections = SECTION_KEYS.map(({ key, tKey }) => ({ key, label: t(tKey) }))

  return (
    <div className="noti-header">
      <div className="noti-header-row">
        <h1 className="noti-page-title">{pageTitle}</h1>
        {activeSection === 'notifications' && unreadCount > 0 && (
          <button type="button" onClick={onMarkAllSeen} className="noti-mark-read-btn">
            {t('notifications.header.markAllRead')}
          </button>
        )}
      </div>

      {showAppointments && (
        <div className="noti-seg-control">
          {sections.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onSectionChange(s.key)}
              className={`noti-seg-btn${activeSection === s.key ? ' is-active' : ''}`}
            >
              {s.label}
              {s.key === 'notifications' && unreadCount > 0 && (
                <span className="noti-seg-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
