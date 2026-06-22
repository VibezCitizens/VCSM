import { useNavigate } from "react-router-dom";
import { useVportOwnerQuickStats } from "@/features/profiles/kinds/vport/hooks/useVportOwnerQuickStats";

function StatPill({ value, label, loading }) {
  return (
    <div className="bs-stat-pill">
      <span className="bs-stat-value">{loading ? "—" : value}</span>
      <span className="bs-stat-label">{label}</span>
    </div>
  );
}

export default function VportBarberShopOwnerBand({ actorId, callerActorId, onNewBooking, hideBookingButton = false }) {
  const navigate           = useNavigate();
  const { stats, loading } = useVportOwnerQuickStats(actorId, callerActorId);

  return (
    <div className="bs-owner-band">
      <div className="bs-owner-band-top">
        <span className="bs-owner-badge">Your Business</span>
        <button
          type="button"
          className="bs-owner-dash-link"
          onClick={() => navigate(`/actor/${actorId}/dashboard`)}
        >
          Full Dashboard →
        </button>
      </div>

      <div className="bs-owner-stats-row">
        <StatPill value={stats?.todayCount    ?? 0} label="Today"    loading={loading} />
        <StatPill value={stats?.upcomingCount ?? 0} label="Upcoming" loading={loading} />
        <StatPill value={stats?.activeBarbers ?? 0} label="Barbers"  loading={loading} />

        {!hideBookingButton && (
          <button
            type="button"
            className="bs-new-booking-btn"
            onClick={onNewBooking}
          >
            <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>+</span>
            New Booking
          </button>
        )}
      </div>
    </div>
  );
}
