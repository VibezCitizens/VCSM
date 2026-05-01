import { useState } from "react";
import { formatTimestamp } from "@/shared/lib/formatTimestamp";
import useMyAppointments from "@/features/notifications/screen/hooks/useMyAppointments";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "pending",  label: "Pending"  },
  { key: "past",     label: "Past"     },
];

const STATUS_STYLES = {
  pending:   { label: "Pending",   color: "rgba(234,179,8,0.9)",   bg: "rgba(234,179,8,0.10)",   border: "rgba(234,179,8,0.25)"   },
  confirmed: { label: "Confirmed", color: "rgba(52,211,153,0.95)", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)"  },
  completed: { label: "Completed", color: "rgba(148,163,184,0.7)", bg: "rgba(148,163,184,0.07)", border: "rgba(148,163,184,0.18)" },
  cancelled: { label: "Cancelled", color: "rgba(239,68,68,0.75)",  bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
  no_show:   { label: "No Show",   color: "rgba(251,146,60,0.85)", bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.2)"  },
};

function formatApptTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatApptDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function AppointmentSkeleton() {
  return (
    <div className="appt-skeleton">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <div className="noti-skeleton-pulse" style={{ height: 14, width: 160, borderRadius: 6 }} />
          <div className="noti-skeleton-pulse" style={{ height: 11, width: 100, borderRadius: 6 }} />
        </div>
        <div className="noti-skeleton-pulse" style={{ height: 22, width: 72, borderRadius: 100 }} />
      </div>
      <div className="noti-skeleton-pulse" style={{ height: 11, width: 140, borderRadius: 6 }} />
    </div>
  );
}

function AppointmentCard({ booking, provider, onCancel, cancelling, onDismiss, dismissing }) {
  const [cancelError, setCancelError] = useState(null);
  const statusStyle = STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending;
  const isBusy = cancelling === booking.id;
  const isDismissing = dismissing === booking.id;
  const canCancel = booking.status === "pending" || booking.status === "confirmed";
  const canDismiss = booking.status === "cancelled" || booking.status === "completed" || booking.status === "no_show";
  const timeStr = formatApptTime(booking.startsAt);
  const dateStr = formatApptDate(booking.startsAt);
  const providerName = provider?.name ?? null;

  const variant =
    booking.status === "confirmed" ? "upcoming"
    : booking.status === "pending" ? "pending"
    : "past";

  async function handleCancel() {
    setCancelError(null);
    try { await onCancel(booking.id); }
    catch (err) { setCancelError(err?.message ?? "Could not cancel. Try again."); }
  }

  return (
    <div className={`appt-card appt-card--${variant}`}>
      {/* Header row: service + status badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--vc-text)", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {booking.serviceLabelSnapshot || "Appointment"}
          </div>
          {providerName && (
            <div style={{ fontSize: 12, color: "rgba(167,139,250,0.85)", marginTop: 3, fontWeight: 500 }}>
              with {providerName}
            </div>
          )}
        </div>
        <span
          className="appt-status-badge"
          style={{ color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, flexShrink: 0 }}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Date / time row */}
      <div style={{ fontSize: 13, color: "var(--vc-text-soft)", display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
        {dateStr && <span>{dateStr}</span>}
        {timeStr && <span style={{ opacity: 0.75 }}>· {timeStr}</span>}
        {booking.durationMinutes > 0 && (
          <span style={{ opacity: 0.55 }}>· {booking.durationMinutes} min</span>
        )}
      </div>

      {booking.customerNote && (
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--vc-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          "{booking.customerNote}"
        </div>
      )}

      {/* Actions */}
      {(canCancel || canDismiss || cancelError) && (
        <>
          <div className="appt-card-divider" />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {canCancel && (
              <button
                type="button"
                disabled={isBusy}
                onClick={handleCancel}
                className="notifications-action-btn notifications-action-btn--ghost"
              >
                {isBusy ? "Cancelling…" : "Cancel"}
              </button>
            )}
            {canDismiss && (
              <button
                type="button"
                disabled={isDismissing}
                onClick={() => onDismiss(booking.id)}
                className="notifications-action-btn notifications-action-btn--decline"
              >
                {isDismissing ? "Removing…" : "Remove"}
              </button>
            )}
            {cancelError && (
              <span style={{ fontSize: 11, color: "rgba(239,68,68,0.8)", marginLeft: "auto" }}>
                {cancelError}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TabList({ activeTab, onChange, upcoming, pending, past }) {
  const counts = { upcoming: upcoming.length, pending: pending.length, past: past.length };
  return (
    <div className="appt-tabs">
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key;
        const count = counts[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`appt-tab-btn${isActive ? " is-active" : ""}`}
          >
            {label}
            {count > 0 && (
              <span className="appt-tab-count">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function EmptyAppointments({ tab }) {
  const messages = {
    upcoming: { icon: "📅", title: "No upcoming appointments", body: "Confirmed bookings will appear here." },
    pending:  { icon: "⏳", title: "No pending requests",      body: "Requests waiting for confirmation show here." },
    past:     { icon: "🗂️", title: "No past appointments",     body: "Completed and cancelled bookings appear here." },
  };
  const msg = messages[tab] ?? messages.upcoming;
  return (
    <div className="notifications-empty">
      <span style={{ fontSize: 32, lineHeight: 1 }}>{msg.icon}</span>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--vc-text-soft)", marginTop: 8 }}>
        {msg.title}
      </div>
      <div style={{ fontSize: 12, color: "var(--vc-text-muted)" }}>
        {msg.body}
      </div>
    </div>
  );
}

export default function MyAppointmentsView({ actorId }) {
  const [activeTab, setActiveTab] = useState("upcoming");
  const { loading, error, upcoming, pending, past, ownerNames, cancelAppointment, cancelling, dismissAppointment, dismissing } =
    useMyAppointments({ actorId });

  const tabRows = { upcoming, pending, past }[activeTab] ?? [];

  return (
    <div>
      <TabList
        activeTab={activeTab}
        onChange={setActiveTab}
        upcoming={upcoming}
        pending={pending}
        past={past}
      />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <AppointmentSkeleton />
          <AppointmentSkeleton />
          <AppointmentSkeleton />
        </div>
      ) : error ? (
        <div className="notifications-empty" style={{ color: "rgba(239,68,68,0.8)", fontSize: 13 }}>
          {error}
        </div>
      ) : tabRows.length === 0 ? (
        <EmptyAppointments tab={activeTab} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tabRows.map((b) => (
            <AppointmentCard
              key={b.id}
              booking={b}
              provider={b.ownerActorId ? (ownerNames[b.ownerActorId] ?? null) : null}
              onCancel={cancelAppointment}
              cancelling={cancelling}
              onDismiss={dismissAppointment}
              dismissing={dismissing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
