// src/features/dashboard/vport/screens/VportDashboardBookingHistoryScreen.jsx
import { useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/model/vportDashboardShellStyles";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";

import { useOwnerBookingResources } from "@/features/booking/adapters/booking.adapter";
import useBookingHistory from "@/features/booking/hooks/useBookingHistory";
import { useActorSummary } from "@/state/actors/useActorSummary";

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function StatusIcon({ status }) {
  switch (status) {
    case "confirmed": return <CheckCircle size={14} className="text-emerald-400" />;
    case "completed": return <CheckCircle size={14} className="text-sky-400" />;
    case "cancelled": return <XCircle size={14} className="text-red-400" />;
    case "no_show": return <AlertCircle size={14} className="text-amber-400" />;
    default: return <Clock size={14} className="text-white/40" />;
  }
}

function StatusLabel({ status }) {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show",
    hold: "Hold",
  };
  return <span className="capitalize">{labels[status] ?? status ?? "Unknown"}</span>;
}

function CustomerName({ customerActorId, fallbackName }) {
  const summary = useActorSummary({
    actorId: customerActorId,
    displayName: fallbackName,
  });

  const name = summary?.displayName ?? fallbackName ?? "Customer";

  return <span className="text-sm font-medium text-white truncate">{name}</span>;
}

function BookingRow({ booking }) {
  const isPast = booking.startsAt && new Date(booking.startsAt).getTime() < Date.now();

  return (
    <div className={[
      "flex items-center gap-3 rounded-xl border px-3 py-3 transition-all",
      booking.status === "cancelled"
        ? "border-white/5 bg-white/[0.01] opacity-60"
        : isPast
          ? "border-white/6 bg-white/[0.02]"
          : "border-white/10 bg-white/[0.03]",
    ].join(" ")}>
      {/* Time column */}
      <div className="shrink-0 w-16 text-center">
        <div className="text-sm font-bold text-white">{formatTime(booking.startsAt)}</div>
        <div className="text-[10px] text-white/35">
          {booking.durationMinutes ? `${booking.durationMinutes}m` : ""}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-white/10 shrink-0" />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <CustomerName
            customerActorId={booking.customerActorId}
            fallbackName={booking.customerName}
          />
        </div>
        <div className="mt-0.5 text-xs text-white/40 truncate">
          {booking.serviceLabelSnapshot || "Appointment"}
        </div>
      </div>

      {/* Status */}
      <div className="shrink-0 flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1">
        <StatusIcon status={booking.status} />
        <span className="text-xs text-white/60">
          <StatusLabel status={booking.status} />
        </span>
      </div>
    </div>
  );
}

function groupByDate(bookings) {
  const groups = new Map();
  for (const b of bookings) {
    const d = new Date(b.startsAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  }
  return groups;
}

export default function VportDashboardBookingHistoryScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity } = useIdentity();
  const targetActorId = params?.actorId ?? null;
  const viewerActorId = identity?.actorId ?? null;
  const isDesktop = useDesktopBreakpoint();
  const isOwner = Boolean(targetActorId) && Boolean(viewerActorId) && String(viewerActorId) === String(targetActorId);

  const resources = useOwnerBookingResources({
    ownerActorId: targetActorId,
    includeInactive: true,
    enabled: Boolean(targetActorId),
  });

  const resourceId = resources.primary?.id ?? null;

  const {
    bookings,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    statusFilter,
    setStatusFilter,
    statusFilters,
  } = useBookingHistory({ resourceId, enabled: Boolean(resourceId) });

  const grouped = useMemo(() => groupByDate(bookings), [bookings]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    return { total, confirmed, pending, cancelled };
  }, [bookings]);

  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 900 });

  if (!targetActorId) return null;
  if (!isOwner) return <div className="p-10 text-center text-neutral-400">Owner access only.</div>;

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton
              isDesktop={isDesktop}
              onClick={() => navigate(`/actor/${targetActorId}/dashboard`)}
              style={shell.btn("soft")}
            />
            <div style={shell.title}>BOOKING HISTORY</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16 }}>
            {/* Stats bar */}
            <div className="mb-4 grid grid-cols-4 gap-2">
              {[
                { label: "Total", value: stats.total, color: "text-white" },
                { label: "Confirmed", value: stats.confirmed, color: "text-emerald-400" },
                { label: "Pending", value: stats.pending, color: "text-amber-300" },
                { label: "Cancelled", value: stats.cancelled, color: "text-red-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-white/35">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter pills */}
            <div className="mb-4 flex flex-wrap gap-2">
              {statusFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === f.key
                      ? "border-sky-300/40 bg-sky-300/12 text-sky-100"
                      : "border-white/8 bg-white/[0.03] text-white/40 hover:text-white/60",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Loading */}
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                <div className="text-sm text-white/40">Loading history...</div>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
                {String(error?.message ?? error)}
              </div>
            ) : !bookings.length ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Calendar size={32} className="text-white/15" />
                <div className="text-sm font-medium text-white/40">No bookings found</div>
                <div className="text-xs text-white/25">
                  {statusFilter !== "all" ? "Try a different filter." : "Bookings will appear here once customers start booking."}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {Array.from(grouped.entries()).map(([dateLabel, dayBookings]) => (
                  <div key={dateLabel}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-medium text-white/40">{dateLabel}</div>
                      <div className="text-[10px] text-white/25">{dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="space-y-1.5">
                      {dayBookings.map((b) => (
                        <BookingRow key={b.id} booking={b} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load more */}
            {hasMore && !loading ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="mt-4 w-full rounded-xl border border-white/8 bg-white/[0.02] py-3 text-center text-sm font-medium text-white/50 hover:bg-white/5 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: "#000" }}>{content}</div>,
      document.body,
    );
  }

  return content;
}
