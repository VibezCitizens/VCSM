import { useEffect } from "react";
import { hydrateActorsByIds } from "@hydration";
import { useActorSummary } from "@/state/actors/useActorSummary";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const STATUS_CFG = {
  pending:   { label: "Pending",   textColor: "rgba(251,191,36,.9)",  bg: "rgba(251,191,36,.1)",  border: "rgba(251,191,36,.18)" },
  confirmed: { label: "Confirmed", textColor: "rgba(52,211,153,.9)",  bg: "rgba(52,211,153,.1)",  border: "rgba(52,211,153,.18)" },
  completed: { label: "Done",      textColor: "rgba(56,189,248,.9)",  bg: "rgba(56,189,248,.1)",  border: "rgba(56,189,248,.18)" },
  cancelled: { label: "Cancelled", textColor: "rgba(252,165,165,.6)", bg: "rgba(239,68,68,.06)",  border: "rgba(239,68,68,.12)"  },
  no_show:   { label: "No Show",   textColor: "rgba(251,191,36,.7)",  bg: "rgba(245,158,11,.07)", border: "rgba(245,158,11,.14)" },
  hold:      { label: "Hold",      textColor: "rgba(255,255,255,.35)",bg: "transparent",          border: "rgba(255,255,255,.08)" },
};

function ClientCell({ actorId, fallbackName }) {
  const summary = useActorSummary({ actorId, displayName: fallbackName });
  useEffect(() => {
    if (summary.missing && actorId) hydrateActorsByIds([actorId]).catch(() => {});
  }, [actorId, summary.missing]);
  const name   = summary?.displayName ?? fallbackName ?? "Client";
  const avatar = summary?.avatar ?? "/avatar.jpg";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img
        src={avatar} alt={name}
        style={{ width: 38, height: 38, borderRadius: 9, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,.08)" }}
        onError={(e) => { e.currentTarget.src = "/avatar.jpg"; }}
      />
      <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,.92)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </span>
    </div>
  );
}

function ActionBtn({ label, onClick, disabled, textColor, bg, border }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        height: 34, padding: "0 13px", borderRadius: 9, fontSize: 12, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        color: textColor, background: bg, border: `1px solid ${border}`,
        opacity: disabled ? 0.45 : 1, transition: "opacity .12s",
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

export default function OperationalBookingCard({ booking, isNext, onConfirm, onCancel, onComplete, onNoShow, working }) {
  const isTerminal = ["cancelled", "no_show", "completed"].includes(booking.status);
  const isPast     = booking.startsAt && new Date(booking.startsAt).getTime() < Date.now();
  const canConfirm  = booking.status === "pending";
  const canComplete = booking.status === "confirmed";
  const canNoShow   = booking.status === "confirmed" && isPast;
  const canCancel   = ["pending", "confirmed"].includes(booking.status);
  const hasActions  = canConfirm || canComplete || canNoShow || canCancel;

  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.hold;

  const cardBg     = isNext
    ? "rgba(139,92,246,.08)"
    : isTerminal
      ? "rgba(255,255,255,.015)"
      : "rgba(15,23,42,.7)";
  const cardBorder = isNext
    ? "rgba(139,92,246,.35)"
    : isTerminal
      ? "rgba(255,255,255,.05)"
      : "rgba(148,163,184,.12)";

  return (
    <div style={{
      borderRadius: 16, border: `1px solid ${cardBorder}`, background: cardBg,
      overflow: "hidden", opacity: isTerminal ? 0.65 : 1,
      transition: "border-color .15s",
    }}>
      {isNext && (
        <div style={{
          padding: "5px 14px", fontSize: 10, fontWeight: 800, letterSpacing: ".08em",
          color: "rgba(167,139,250,.9)", background: "rgba(139,92,246,.15)",
          borderBottom: "1px solid rgba(139,92,246,.2)",
        }}>
          ▶ NEXT UP
        </div>
      )}

      <div style={{ padding: "14px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Time column */}
        <div style={{ flexShrink: 0, width: 56, textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: isTerminal ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.9)", lineHeight: 1 }}>
            {formatTime(booking.startsAt)}
          </div>
          {booking.durationMinutes > 0 && (
            <div style={{ fontSize: 10, color: "rgba(148,163,184,.45)", marginTop: 4 }}>
              {booking.durationMinutes}m
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,.07)", flexShrink: 0 }} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 5 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <ClientCell actorId={booking.customerActorId} fallbackName={booking.customerName} />
            <span style={{
              flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: ".05em",
              color: cfg.textColor, background: cfg.bg, border: `1px solid ${cfg.border}`,
              borderRadius: 6, padding: "3px 8px",
            }}>
              {cfg.label}
            </span>
          </div>
          {booking.serviceLabelSnapshot && (
            <div style={{ fontSize: 12, color: "rgba(148,163,184,.55)", paddingLeft: 1 }}>
              {booking.serviceLabelSnapshot}
            </div>
          )}
          {booking.customerNote && (
            <div style={{ fontSize: 11, color: "rgba(148,163,184,.38)", fontStyle: "italic", paddingLeft: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              "{booking.customerNote}"
            </div>
          )}
        </div>
      </div>

      {hasActions && (
        <div style={{
          padding: "10px 14px 14px",
          borderTop: "1px solid rgba(255,255,255,.05)",
          display: "flex", gap: 7, flexWrap: "wrap",
        }}>
          {canConfirm  && <ActionBtn label="Confirm"  disabled={working} onClick={() => onConfirm(booking.id)}  textColor="rgba(52,211,153,.9)"  bg="rgba(52,211,153,.1)"  border="rgba(52,211,153,.22)" />}
          {canComplete && <ActionBtn label="Complete" disabled={working} onClick={() => onComplete(booking.id)} textColor="rgba(56,189,248,.9)"  bg="rgba(56,189,248,.1)"  border="rgba(56,189,248,.22)" />}
          {canNoShow   && <ActionBtn label="No Show"  disabled={working} onClick={() => onNoShow(booking.id)}   textColor="rgba(251,191,36,.8)"  bg="rgba(251,191,36,.08)" border="rgba(251,191,36,.18)" />}
          {canCancel   && <ActionBtn label="Cancel"   disabled={working} onClick={() => onCancel(booking.id)}   textColor="rgba(252,165,165,.7)" bg="rgba(239,68,68,.07)"  border="rgba(239,68,68,.16)"  />}
        </div>
      )}
    </div>
  );
}
