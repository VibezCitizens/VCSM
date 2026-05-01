const ALL_SECTIONS = [
  { key: "notifications", label: "Notifications" },
  { key: "appointments",  label: "Appointments"  },
];

export default function NotificationsHeader({
  unreadCount,
  onMarkAllSeen,
  activeSection,
  onSectionChange,
  showAppointments,
}) {
  const pageTitle = showAppointments ? "Notifications" : "Vport Notifications";

  return (
    <div className="noti-header">
      <div className="noti-header-row">
        <h1 className="noti-page-title">{pageTitle}</h1>
        {activeSection === "notifications" && unreadCount > 0 && (
          <button type="button" onClick={onMarkAllSeen} className="noti-mark-read-btn">
            Mark all read
          </button>
        )}
      </div>

      {showAppointments && (
        <div className="noti-seg-control">
          {ALL_SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onSectionChange(s.key)}
              className={`noti-seg-btn${activeSection === s.key ? " is-active" : ""}`}
            >
              {s.label}
              {s.key === "notifications" && unreadCount > 0 && (
                <span className="noti-seg-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
