import { useEffect } from "react";
import { hydrateActorsByIds } from "@hydration";
import { useActorSummary } from "@/state/actors/useActorSummary";

function pad2(n) { return String(n).padStart(2, "0"); }
function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const STATUS_CONFIG = {
  pending:   { label: "Pending",   cls: "text-amber-300 border-amber-300/20 bg-amber-300/8" },
  confirmed: { label: "Confirmed", cls: "text-emerald-400 border-emerald-400/20 bg-emerald-400/8" },
  completed: { label: "Completed", cls: "text-sky-400 border-sky-400/20 bg-sky-400/8" },
  cancelled: { label: "Cancelled", cls: "text-red-400 border-red-400/20 bg-red-400/8" },
  no_show:   { label: "No Show",   cls: "text-amber-500 border-amber-500/20 bg-amber-500/8" },
  hold:      { label: "Hold",      cls: "text-white/40 border-white/10 bg-white/[0.03]" },
};

function CustomerCell({ customerActorId, fallbackName }) {
  const summary = useActorSummary({ actorId: customerActorId, displayName: fallbackName });
  useEffect(() => {
    if (summary.missing && customerActorId) {
      hydrateActorsByIds([customerActorId]).catch(() => {});
    }
  }, [customerActorId, summary.missing]);
  const name   = summary?.displayName ?? fallbackName ?? "Customer";
  const avatar = summary?.avatar ?? "/avatar.jpg";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <img
        src={avatar}
        alt={name}
        className="shrink-0 w-8 h-8 rounded-lg object-cover"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        onError={(e) => { e.currentTarget.src = "/avatar.jpg"; }}
      />
      <span className="text-sm font-medium text-white truncate">{name}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status ?? "Unknown", cls: "text-white/40 border-white/10 bg-white/[0.03]" };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium shrink-0 ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function ActionButton({ label, onClick, disabled, colorCls }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-40 transition-colors ${colorCls}`}
    >
      {label}
    </button>
  );
}

export default function BookingCard({ booking, onConfirm, onCancel, onComplete, onNoShow, working }) {
  const isPast    = booking.startsAt && new Date(booking.startsAt).getTime() < Date.now();
  const canConfirm = booking.status === "pending";
  const canCancel  = ["pending", "confirmed"].includes(booking.status);
  const canComplete = booking.status === "confirmed";
  const canNoShow   = booking.status === "confirmed" && isPast;
  const hasActions  = canConfirm || canCancel || canComplete || canNoShow;

  return (
    <div
      className={[
        "rounded-xl border px-3 py-3 space-y-2.5 transition-all",
        ["cancelled", "no_show"].includes(booking.status)
          ? "border-white/5 bg-white/[0.01] opacity-60"
          : "border-white/10 bg-white/[0.03]",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-14 text-center">
          <div className="text-sm font-bold text-white">{formatTime(booking.startsAt)}</div>
          <div className="text-[10px] text-white/35">
            {booking.durationMinutes ? `${booking.durationMinutes}m` : ""}
          </div>
        </div>
        <div className="w-px h-9 bg-white/10 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CustomerCell customerActorId={booking.customerActorId} fallbackName={booking.customerName} />
            <StatusBadge status={booking.status} />
          </div>
          <div className="mt-0.5 text-xs text-white/40 truncate">
            {booking.serviceLabelSnapshot || "Appointment"}
          </div>
        </div>
      </div>

      {hasActions && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/[0.05]">
          {canConfirm  && <ActionButton label="Confirm"  disabled={working} onClick={() => onConfirm(booking.id)}  colorCls="text-emerald-300 border-emerald-300/20 bg-emerald-300/8 hover:bg-emerald-300/14" />}
          {canComplete && <ActionButton label="Complete" disabled={working} onClick={() => onComplete(booking.id)} colorCls="text-sky-300 border-sky-300/20 bg-sky-300/8 hover:bg-sky-300/14" />}
          {canNoShow   && <ActionButton label="No Show"  disabled={working} onClick={() => onNoShow(booking.id)}   colorCls="text-amber-300 border-amber-300/20 bg-amber-300/8 hover:bg-amber-300/14" />}
          {canCancel   && <ActionButton label="Cancel"   disabled={working} onClick={() => onCancel(booking.id)}   colorCls="text-red-400 border-red-400/20 bg-red-400/8 hover:bg-red-400/14" />}
        </div>
      )}
    </div>
  );
}
