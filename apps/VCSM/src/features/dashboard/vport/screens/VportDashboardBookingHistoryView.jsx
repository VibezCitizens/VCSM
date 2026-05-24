import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";

import { hydrateActorsByIds } from "@hydration";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { useOwnerBookingResources, useBookingHistory } from "@/features/booking/adapters/booking.adapter";
import useVportBookingActions from "@/features/dashboard/vport/hooks/useVportBookingActions";
import BookingCard from "@/features/dashboard/vport/components/bookingHistory/BookingCard";
import TodayView from "@/features/dashboard/vport/components/bookingHistory/TodayView";
import QuickBookingModal from "@/features/dashboard/vport/components/bookingHistory/QuickBookingModal";
import { filterBookings, groupByDate } from "@/features/dashboard/vport/screens/model/vportBookingHistoryView.model";

const HISTORY_TABS = [
  { key: "past",      label: "Past"      },
  { key: "cancelled", label: "Cancelled" },
  { key: "all",       label: "All"       },
];

function ModeToggle({ mode, onChange }) {
  return (
    <div style={{ display: "flex", gap: 0, borderRadius: 10, border: "1px solid rgba(148,163,184,.14)", overflow: "hidden", background: "rgba(2,6,23,.6)" }}>
      {[{ k: "today", l: "Today" }, { k: "upcoming", l: "Upcoming" }, { k: "history", l: "History" }].map(({ k, l }) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          style={{
            flex: 1, height: 36, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none",
            background: mode === k ? "rgba(139,92,246,.25)" : "transparent",
            color: mode === k ? "rgba(167,139,250,.95)" : "rgba(148,163,184,.5)",
            transition: "all .12s",
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export default function VportDashboardBookingHistoryView({ ownerActorId, viewerActorId }) {
  const navigate   = useNavigate();
  const isDesktop  = useDesktopBreakpoint();

  const [mode,        setMode]        = useState("today");
  const [historyTab,  setHistoryTab]  = useState("past");
  const [showNewBook, setShowNewBook] = useState(false);

  const resources  = useOwnerBookingResources({ ownerActorId, includeInactive: true, enabled: Boolean(ownerActorId) });
  const resourceId = resources.primary?.id ?? null;

  const { bookings, loading: histLoading, loadingMore, hasMore, error: histError, loadMore, reload } =
    useBookingHistory({
      ownerActorId,
      callerActorId: viewerActorId,
      resourceId,
      enabled: Boolean(resourceId),
    });

  const actions = useVportBookingActions({ onSuccess: reload, actorId: ownerActorId });

  useEffect(() => {
    const ids = [...new Set(bookings.map(b => b.customerActorId).filter(Boolean))];
    if (ids.length) hydrateActorsByIds(ids).catch(() => {});
  }, [bookings]);

  const loading = resources.loading || (Boolean(resourceId) && histLoading);
  const error   = resources.error ?? histError ?? null;

  const upcomingFiltered = useMemo(() => filterBookings(bookings, "upcoming"), [bookings]);
  const upcomingGrouped  = useMemo(() => groupByDate(upcomingFiltered), [upcomingFiltered]);

  const histFiltered = useMemo(() => filterBookings(bookings, historyTab), [bookings, historyTab]);
  const histGrouped  = useMemo(() => groupByDate(histFiltered), [histFiltered]);

  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 900 });

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={() => navigate(`/actor/${ownerActorId}/dashboard`)} />
            <div style={shell.title}>BOOKINGS</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: "0 16px 16px" }}>
            <div style={{ marginBottom: 16 }}>
              <ModeToggle mode={mode} onChange={setMode} />
            </div>

            {mode === "today" && (
              <TodayView
                bookings={bookings}
                actions={actions}
                loading={loading}
                error={error}
                resourceId={resourceId}
                actorId={ownerActorId}
                onNewBooking={() => setShowNewBook(true)}
              />
            )}

            {mode === "upcoming" && (
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", color: "rgba(148,163,184,.4)" }}>
                  FUTURE APPOINTMENTS
                </div>

                {actions.error && (
                  <div style={{ borderRadius: 8, background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.16)", padding: "9px 12px", fontSize: 12, color: "#fca5a5" }}>
                    {actions.error}
                  </div>
                )}

                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 0" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,.15)", borderTopColor: "rgba(255,255,255,.6)", animation: "spin 0.7s linear infinite" }} />
                    <div style={{ fontSize: 13, color: "rgba(148,163,184,.5)" }}>Loading…</div>
                  </div>
                ) : !upcomingFiltered.length ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "40px 0" }}>
                    <Calendar size={28} style={{ color: "rgba(255,255,255,.15)" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.38)" }}>No upcoming bookings</div>
                    <div style={{ fontSize: 12, color: "rgba(148,163,184,.3)" }}>Future appointments will appear here.</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 20 }}>
                    {Array.from(upcomingGrouped.entries()).map(([dateLabel, dayBookings]) => (
                      <div key={dateLabel}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(148,163,184,.42)", letterSpacing: ".05em" }}>{dateLabel}</div>
                          <div style={{ fontSize: 10, color: "rgba(148,163,184,.28)" }}>{dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}</div>
                        </div>
                        <div style={{ display: "grid", gap: 8 }}>
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
              </div>
            )}

            {mode === "history" && (
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
                  {HISTORY_TABS.map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setHistoryTab(t.key)}
                      style={{
                        flexShrink: 0, height: 30, padding: "0 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        border: historyTab === t.key ? "1px solid rgba(255,255,255,.2)" : "1px solid rgba(255,255,255,.08)",
                        background: historyTab === t.key ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.03)",
                        color: historyTab === t.key ? "rgba(255,255,255,.9)" : "rgba(148,163,184,.45)",
                        transition: "all .12s",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {actions.error && (
                  <div style={{ borderRadius: 8, background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.16)", padding: "9px 12px", fontSize: 12, color: "#fca5a5" }}>
                    {actions.error}
                  </div>
                )}

                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 0" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,.15)", borderTopColor: "rgba(255,255,255,.6)", animation: "spin 0.7s linear infinite" }} />
                    <div style={{ fontSize: 13, color: "rgba(148,163,184,.5)" }}>Loading…</div>
                  </div>
                ) : error ? (
                  <div style={{ borderRadius: 10, background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.18)", padding: "12px 14px", fontSize: 13, color: "#fca5a5" }}>
                    {String(error?.message ?? error)}
                  </div>
                ) : !resourceId ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "40px 0" }}>
                    <Calendar size={28} style={{ color: "rgba(255,255,255,.15)" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.4)" }}>No booking resource</div>
                  </div>
                ) : !histFiltered.length ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "36px 0" }}>
                    <Calendar size={28} style={{ color: "rgba(255,255,255,.15)" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.38)" }}>Nothing here</div>
                    <div style={{ fontSize: 12, color: "rgba(148,163,184,.3)" }}>No bookings in this category.</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 20 }}>
                    {Array.from(histGrouped.entries()).map(([dateLabel, dayBookings]) => (
                      <div key={dateLabel}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(148,163,184,.42)", letterSpacing: ".05em" }}>{dateLabel}</div>
                          <div style={{ fontSize: 10, color: "rgba(148,163,184,.28)" }}>{dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}</div>
                        </div>
                        <div style={{ display: "grid", gap: 8 }}>
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
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    style={{ width: "100%", height: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)", fontSize: 13, fontWeight: 600, color: "rgba(148,163,184,.55)", cursor: "pointer", opacity: loadingMore ? 0.5 : 1 }}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const modal = showNewBook && resourceId && (
    <QuickBookingModal
      ownerActorId={ownerActorId}
      resourceId={resourceId}
      onClose={() => setShowNewBook(false)}
      onCreated={reload}
    />
  );

  if (isDesktop && typeof document !== "undefined") {
    return (
      <>
        {createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: "#000" }}>
            {content}
          </div>,
          document.body
        )}
        {modal}
      </>
    );
  }

  return <>{content}{modal}</>;
}
