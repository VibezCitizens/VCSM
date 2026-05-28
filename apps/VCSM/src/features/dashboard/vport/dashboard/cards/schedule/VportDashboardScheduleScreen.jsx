import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useVportOwnerSchedule } from "@/features/dashboard/vport/dashboard/cards/schedule/hooks/useVportOwnerSchedule";
import useDesktopBreakpoint from "@/shared/hooks/useDesktopBreakpoint";
import { formatDateHeader } from "./components/schedule/scheduleTimeUtils";
import {
  ScheduleGrid,
  MobileScheduleGrid,
  MobileBarberSelector,
  ScheduleSkeleton,
} from "./components/schedule/ScheduleGrid";
import { CreateBookingModal, BookingDetailModal } from "./components/schedule/ScheduleModals";
import ScheduleOperationalView from "./components/schedule/ScheduleOperationalView";
import "@/features/dashboard/vport/styles/dashboard-schedule-modern.css";

export default function VportDashboardScheduleScreen({ actorId: propActorId, embedded = false }) {
  const { actorId: routeActorId } = useParams();
  const actorId  = propActorId ?? routeActorId;
  const navigate = useNavigate();
  const isDesktop = useDesktopBreakpoint();

  const [mobileView, setMobileView] = useState("operational");

  const {
    dateKey, isToday,
    scheduleData, loading, error, refresh,
    mobileBarberIdx, setMobileBarberIdx,
    createModal, openCreateModal, closeCreateModal, submitCreateBooking,
    detailModal, openDetailModal, closeDetailModal, updateBookingStatus,
    saving, saveError,
    prevDay, nextDay, goToToday,
  } = useVportOwnerSchedule({ actorId });

  const lanes    = scheduleData?.lanes ?? [];
  const services = scheduleData?.services ?? [];

  const handleSlotClick = useCallback((resourceId, startTime) => {
    openCreateModal(resourceId, startTime);
  }, [openCreateModal]);

  const activeMobileLane = lanes[mobileBarberIdx] ?? null;

  return (
    <div
      className="sched-page"
      style={embedded
        ? { height: "100%", display: "flex", flexDirection: "column" }
        : { minHeight: "100vh", display: "flex", flexDirection: "column" }
      }
    >
      {/* Top bar */}
      <div className={`sched-topbar${embedded ? " sched-topbar--embedded" : ""}`}>
        {!embedded && (
          <div className="sched-topbar-left">
            <button type="button" className="sched-nav-btn" onClick={() => navigate(-1)} aria-label="Back">‹</button>
            <span className="sched-page-title">Schedule</span>
          </div>
        )}

        <div className="sched-date-nav" style={embedded ? { flex: 1 } : {}}>
          {mobileView === "timeline" && !isDesktop && (
            <button type="button" className="sched-nav-btn" onClick={() => setMobileView("operational")} aria-label="Back to summary" style={{ marginRight: 2 }}>‹</button>
          )}
          {(mobileView === "operational" || isDesktop) && (
            <button type="button" className="sched-nav-btn" onClick={prevDay} aria-label="Previous day">‹</button>
          )}
          <span className="sched-date-label">{formatDateHeader(dateKey, isToday)}</span>
          {(mobileView === "operational" || isDesktop) && (
            <button type="button" className="sched-nav-btn" onClick={nextDay} aria-label="Next day">›</button>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!isToday && (mobileView === "operational" || isDesktop) && (
            <button type="button" className="sched-today-btn" onClick={goToToday}>Today</button>
          )}
          {isDesktop && (
            <button
              type="button"
              className="sched-add-btn"
              onClick={() => { if (lanes.length > 0) openCreateModal(lanes[0].resource.id, "10:00"); }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>+</span>
              {" Booking"}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <ScheduleSkeleton />
      ) : error ? (
        <div className="sched-empty">
          <span className="sched-empty-icon">⚠️</span>
          <div className="sched-empty-title">Failed to load schedule</div>
          <div className="sched-empty-body">{error}</div>
          <button type="button" className="sched-empty-btn" onClick={refresh}>Retry</button>
        </div>
      ) : isDesktop ? (
        lanes.length === 0 ? (
          <div className="sched-empty">
            <span className="sched-empty-icon">🗓</span>
            <div className="sched-empty-title">No team members yet</div>
            <div className="sched-empty-body">Add team members to start scheduling appointments.</div>
            <button type="button" className="sched-empty-btn" onClick={() => navigate(`/actor/${actorId}/dashboard/team`)}>
              + Add team member
            </button>
          </div>
        ) : (
          <ScheduleGrid
            lanes={lanes}
            isToday={isToday}
            onSlotClick={handleSlotClick}
            onBookingClick={openDetailModal}
          />
        )
      ) : mobileView === "operational" ? (
        <ScheduleOperationalView
          lanes={lanes}
          isToday={isToday}
          openCreateModal={lanes.length > 0 ? openCreateModal : null}
          onBookingClick={openDetailModal}
          onViewTimeline={() => setMobileView("timeline")}
        />
      ) : (
        <>
          {lanes.length > 1 && (
            <MobileBarberSelector lanes={lanes} activeIdx={mobileBarberIdx} onSelect={setMobileBarberIdx} />
          )}
          {activeMobileLane && (
            <MobileScheduleGrid
              lane={activeMobileLane}
              colorIdx={mobileBarberIdx}
              isToday={isToday}
              onSlotClick={handleSlotClick}
              onBookingClick={openDetailModal}
            />
          )}
        </>
      )}

      {createModal && (
        <CreateBookingModal
          modal={createModal}
          services={services}
          lanes={lanes}
          saving={saving}
          saveError={saveError}
          onClose={closeCreateModal}
          onSubmit={submitCreateBooking}
        />
      )}

      {detailModal && (
        <BookingDetailModal
          booking={detailModal}
          lanes={lanes}
          saving={saving}
          saveError={saveError}
          onClose={closeDetailModal}
          onStatusChange={updateBookingStatus}
        />
      )}
    </div>
  );
}
