import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar } from "lucide-react";
import { hydrateActorsByIds } from "@hydration";
import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import useVportOwnerResources from "@/features/dashboard/vport/hooks/useVportOwnerResources";
import useVportBookingHistory from "@/features/dashboard/vport/hooks/useVportBookingHistory";
import useVportBookingActions from "@/features/dashboard/vport/hooks/useVportBookingActions";
import BookingCard from "@/features/dashboard/vport/components/bookingHistory/BookingCard";

const TABS = [
  { key: "all",       label: "All" },
  { key: "pending",   label: "Pending" },
  { key: "today",     label: "Today" },
  { key: "upcoming",  label: "Upcoming" },
  { key: "past",      label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

function filterBookingsByTab(bookings, tab) {
  const now        = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const tomorrowStart = new Date(todayEnd); tomorrowStart.setDate(tomorrowStart.getDate() + 1); tomorrowStart.setHours(0, 0, 0, 0);
  switch (tab) {
    case "pending":   return bookings.filter(b => b.status === "pending");
    case "today":     return bookings.filter(b => { if (!b.startsAt) return false; const t = new Date(b.startsAt).getTime(); return t >= todayStart.getTime() && t <= todayEnd.getTime() && b.status !== "cancelled"; });
    case "upcoming":  return bookings.filter(b => { if (!b.startsAt) return false; const t = new Date(b.startsAt).getTime(); return t >= tomorrowStart.getTime() && !["cancelled","completed","no_show"].includes(b.status); });
    case "past":      return bookings.filter(b => { if (!b.startsAt) return false; return new Date(b.startsAt).getTime() < todayStart.getTime(); });
    case "cancelled": return bookings.filter(b => b.status === "cancelled");
    default:          return bookings;
  }
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
  const params   = useParams();
  const { identity } = useIdentity();
  const isDesktop    = useDesktopBreakpoint();

  const targetActorId = params?.actorId ?? null;
  const viewerActorId = identity?.actorId ?? null;
  const isOwner       = Boolean(targetActorId) && Boolean(viewerActorId) && String(viewerActorId) === String(targetActorId);

  const [activeTab, setActiveTab] = useState("all");

  const resources  = useVportOwnerResources({ ownerActorId: targetActorId, includeInactive: true, enabled: Boolean(targetActorId) });
  const resourceId = resources.primary?.id ?? null;

  const { bookings, loading: historyLoading, loadingMore, hasMore, error: historyError, loadMore, reload } = useVportBookingHistory({ resourceId, enabled: Boolean(resourceId) });

  const actions = useVportBookingActions({ onSuccess: reload });

  useEffect(() => {
    const ids = [...new Set(bookings.map(b => b.customerActorId).filter(Boolean))];
    if (ids.length) hydrateActorsByIds(ids).catch(() => {});
  }, [bookings]);

  const loading  = resources.loading || (Boolean(resourceId) && historyLoading);
  const error    = resources.error ?? historyError ?? null;
  const filtered = useMemo(() => filterBookingsByTab(bookings, activeTab), [bookings, activeTab]);
  const grouped  = useMemo(() => groupByDate(filtered), [filtered]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    return {
      total:     bookings.length,
      today:     bookings.filter(b => { if (!b.startsAt) return false; const t = new Date(b.startsAt).getTime(); return t >= todayStart.getTime() && t <= todayEnd.getTime() && b.status !== "cancelled"; }).length,
      pending:   bookings.filter(b => b.status === "pending").length,
      confirmed: bookings.filter(b => b.status === "confirmed").length,
      completed: bookings.filter(b => b.status === "completed").length,
      cancelled: bookings.filter(b => b.status === "cancelled").length,
    };
  }, [bookings]);

  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 900 });

  if (!targetActorId) return null;
  if (!isOwner) return <div className="p-10 text-center text-white/50">Owner access only.</div>;

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={() => navigate(`/actor/${targetActorId}/dashboard`)} />
            <div style={shell.title}>BOOKINGS</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16 }}>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {[
                { label: "Total",     value: stats.total,     color: "text-white" },
                { label: "Today",     value: stats.today,     color: "text-purple-300" },
                { label: "Pending",   value: stats.pending,   color: "text-amber-300" },
                { label: "Confirmed", value: stats.confirmed, color: "text-emerald-400" },
                { label: "Completed", value: stats.completed, color: "text-sky-400" },
                { label: "Cancelled", value: stats.cancelled, color: "text-red-400" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-white/35">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="mb-4 flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {TABS.map(t => (
                <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                  className={["shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap", activeTab === t.key ? "border-white/20 bg-white/10 text-white" : "border-white/8 bg-white/[0.03] text-white/40 hover:text-white/60"].join(" ")}
                >{t.label}</button>
              ))}
            </div>

            {actions.error && (
              <div className="mb-3 rounded-xl border border-red-500/25 bg-red-500/8 px-3 py-2 text-sm text-red-200">
                {actions.error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                <div className="text-sm text-white/40">Loading bookings...</div>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
                {String(error?.message ?? error)}
              </div>
            ) : !resourceId ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Calendar size={32} className="text-white/15" />
                <div className="text-sm font-medium text-white/40">No booking resource</div>
                <div className="text-xs text-white/25">Set up working hours in Calendar Settings to enable bookings.</div>
              </div>
            ) : !filtered.length ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Calendar size={32} className="text-white/15" />
                <div className="text-sm font-medium text-white/40">No bookings</div>
                <div className="text-xs text-white/25">{activeTab !== "all" ? "Nothing in this category." : "Bookings will appear here once customers start booking."}</div>
              </div>
            ) : (
              <div className="space-y-5">
                {Array.from(grouped.entries()).map(([dateLabel, dayBookings]) => (
                  <div key={dateLabel}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-medium text-white/40">{dateLabel}</div>
                      <div className="text-[10px] text-white/25">{dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="space-y-2">
                      {dayBookings.map(b => (
                        <BookingCard key={b.id} booking={b} working={actions.working}
                          onConfirm={actions.confirm}
                          onCancel={actions.cancel}
                          onComplete={actions.complete}
                          onNoShow={actions.noShow}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasMore && !loading && (
              <button type="button" onClick={loadMore} disabled={loadingMore}
                className="mt-4 w-full rounded-xl border border-white/8 bg-white/[0.02] py-3 text-center text-sm font-medium text-white/50 hover:bg-white/5 disabled:opacity-50 transition-colors"
              >{loadingMore ? "Loading..." : "Load more"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: "#000" }}>
        {content}
      </div>,
      document.body
    );
  }

  return content;
}
