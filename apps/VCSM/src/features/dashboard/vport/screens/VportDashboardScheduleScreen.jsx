import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useVportOwnerSchedule } from "@/features/dashboard/vport/hooks/useVportOwnerSchedule";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { formatDateHeader } from "./components/schedule/scheduleTimeUtils";
import {
  ScheduleGrid,
  MobileScheduleGrid,
  MobileBarberSelector,
  ScheduleSkeleton,
} from "./components/schedule/ScheduleGrid";
import { CreateBookingModal, BookingDetailModal } from "./components/schedule/ScheduleModals";
import "@/features/dashboard/vport/styles/dashboard-schedule-modern.css";

export default function VportDashboardScheduleScreen({ actorId: propActorId, embedded = false }) {
  const { actorId: routeActorId } = useParams();
  const actorId  = propActorId ?? routeActorId;
  const navigate = useNavigate();
  const isDesktop = useDesktopBreakpoint();

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
          <button type="button" className="sched-nav-btn" onClick={prevDay} aria-label="Previous day">‹</button>
          <span className="sched-date-label">{formatDateHeader(dateKey, isToday)}</span>
          <button type="button" className="sched-nav-btn" onClick={nextDay} aria-label="Next day">›</button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!isToday && (
            <button type="button" className="sched-today-btn" onClick={goToToday}>Today</button>
          )}
          <button
            type="button"
            className="sched-add-btn"
            onClick={() => { if (lanes.length > 0) openCreateModal(lanes[0].resource.id, "10:00"); }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>+</span>
            {isDesktop && " Booking"}
          </button>
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
      ) : lanes.length === 0 ? (
        <div className="sched-empty">
          <span className="sched-empty-icon">✂️</span>
          <div className="sched-empty-title">No barbers on your team</div>
          <div className="sched-empty-body">Add barbers to your team to start scheduling appointments.</div>
          <button type="button" className="sched-empty-btn" onClick={() => navigate(`/actor/${actorId}/dashboard/team`)}>
            + Add team member
          </button>
        </div>
      ) : isDesktop ? (
        <ScheduleGrid
          lanes={lanes}
          isToday={isToday}
          onSlotClick={handleSlotClick}
          onBookingClick={openDetailModal}
        />
      ) : (
        <>
          <MobileBarberSelector lanes={lanes} activeIdx={mobileBarberIdx} onSelect={setMobileBarberIdx} />
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
