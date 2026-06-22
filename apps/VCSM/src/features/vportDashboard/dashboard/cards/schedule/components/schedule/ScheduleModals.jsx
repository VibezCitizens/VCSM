import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { LANE_COLORS, STATUS_CONFIG } from "./scheduleConstants";
import { formatHHMM, isoToLocalHHMM } from "./scheduleTimeUtils";

export function CreateBookingModal({ modal, services, lanes, saving, saveError, onClose, onSubmit }) {
  const selectedLane = lanes.find((l) => l.resource.id === modal.resourceId);
  const colorIdx     = lanes.indexOf(selectedLane);
  const color        = LANE_COLORS[(colorIdx >= 0 ? colorIdx : 0) % LANE_COLORS.length];

  const [form, setForm] = useState({
    resourceId:      modal.resourceId,
    dateKey:         modal.dateKey,
    startTime:       modal.startTime,
    durationMinutes: 30,
    serviceId:       "",
    customerName:    "",
    customerNote:    "",
  });

  const selectedService = useMemo(() => services.find((s) => s.id === form.serviceId) ?? null, [services, form.serviceId]);

  useEffect(() => {
    const dur = Number(selectedService?.meta?.duration_minutes);
    if (dur > 0) setForm((f) => ({ ...f, durationMinutes: dur }));
  }, [form.serviceId, selectedService]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const endTime = useMemo(() => {
    const [h, m] = form.startTime.split(":").map(Number);
    const endMin = h * 60 + m + Number(form.durationMinutes);
    return `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
  }, [form.startTime, form.durationMinutes]);

  function handleSubmit(e) {
    e.preventDefault();
    const label = (selectedService?.label ?? selectedService?.key ?? form.serviceId) || "Appointment";
    onSubmit({ ...form, serviceLabelSnapshot: label });
  }

  const barberName = selectedLane?.resource?.name ?? "Barber";

  return createPortal(
    <div className="sched-modal-backdrop" onClick={onClose}>
      <div className="sched-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sched-modal-handle" />
        <div className="sched-modal-header">
          <div className="sched-modal-title">New Booking</div>
          <button type="button" className="sched-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sched-modal-body">
            <div style={{ padding: "10px 12px", borderRadius: 10, background: color.bg, border: `1px solid ${color.border}`, fontSize: 13, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={{ color: color.text, fontWeight: 700 }}>{barberName}</span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{formatHHMM(form.startTime)} → {formatHHMM(endTime)}</span>
            </div>

            <div className="sched-field">
              <label className="sched-label">Service</label>
              <select className="sched-select" value={form.serviceId} onChange={set("serviceId")}>
                <option value="">— No service —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label ?? s.key}{s.meta?.duration_minutes ? ` (${s.meta.duration_minutes} min)` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="sched-field-row">
              <div className="sched-field">
                <label className="sched-label">Start time</label>
                <input type="time" className="sched-input" value={form.startTime} onChange={set("startTime")} required />
              </div>
              <div className="sched-field">
                <label className="sched-label">Duration</label>
                <select className="sched-select" value={form.durationMinutes} onChange={set("durationMinutes")}>
                  {[15, 20, 30, 45, 60, 75, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
            </div>

            <div className="sched-field">
              <label className="sched-label">Customer name</label>
              <input type="text" className="sched-input" placeholder="Walk-in customer" value={form.customerName} onChange={set("customerName")} />
            </div>

            <div className="sched-field">
              <label className="sched-label">Note (optional)</label>
              <textarea className="sched-textarea" placeholder="Phone, instructions, etc." value={form.customerNote} onChange={set("customerNote")} rows={2} />
            </div>

            {saveError && <div className="sched-error-banner">{saveError}</div>}
          </div>

          <div className="sched-modal-footer">
            <button type="button" className="sched-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="sched-btn-primary" disabled={saving}>{saving ? "Saving…" : "Book Appointment"}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export function BookingDetailModal({ booking, lanes, saving, saveError, onClose, onStatusChange }) {
  const laneIdx    = lanes.findIndex((l) => l.resource.id === booking.resource_id);
  const color      = LANE_COLORS[(laneIdx >= 0 ? laneIdx : 0) % LANE_COLORS.length];
  const startStr   = isoToLocalHHMM(booking.starts_at);
  const endStr     = booking.ends_at ? isoToLocalHHMM(booking.ends_at) : null;
  const dateStr    = new Date(booking.starts_at).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const status     = booking.status;
  const statusCfg  = STATUS_CONFIG[status] ?? STATUS_CONFIG.confirmed;
  const barberName = lanes.find((l) => l.resource.id === booking.resource_id)?.resource?.name ?? "Barber";

  return createPortal(
    <div className="sched-modal-backdrop" onClick={onClose}>
      <div className="sched-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sched-modal-handle" />
        <div className="sched-modal-header">
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="sched-modal-title">{booking.service_label_snapshot || "Appointment"}</div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: statusCfg.dot ?? color.dot }}>{statusCfg.label}</span>
          </div>
          <button type="button" className="sched-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="sched-modal-body">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="sched-detail-row">
              <span className="sched-detail-icon">👤</span>
              <div>
                <div className="sched-detail-value">{booking.customer_name || "Walk-in"}</div>
                {booking.customer_note && <div className="sched-detail-muted">"{booking.customer_note}"</div>}
              </div>
            </div>
            <div className="sched-detail-row">
              <span className="sched-detail-icon">✂️</span>
              <div className="sched-detail-value">{barberName}</div>
            </div>
            <div className="sched-detail-row">
              <span className="sched-detail-icon">🕐</span>
              <div>
                <div className="sched-detail-value">{dateStr}</div>
                <div className="sched-detail-muted">
                  {formatHHMM(startStr)}{endStr ? ` → ${formatHHMM(endStr)}` : ""}
                  {booking.duration_minutes ? ` · ${booking.duration_minutes} min` : ""}
                </div>
              </div>
            </div>
          </div>

          <div className="sched-divider" />

          {!["cancelled", "completed"].includes(status) && (
            <div>
              <div className="sched-label" style={{ marginBottom: 8 }}>Update status</div>
              <div className="sched-status-actions">
                {status !== "confirmed" && <button type="button" className="sched-status-btn sched-status-btn--confirm" disabled={saving} onClick={() => onStatusChange(booking.id, "confirmed")}>✓ Confirm</button>}
                {status !== "completed" && <button type="button" className="sched-status-btn sched-status-btn--complete" disabled={saving} onClick={() => onStatusChange(booking.id, "completed")}>✔ Complete</button>}
                {status !== "no_show"   && <button type="button" className="sched-status-btn sched-status-btn--noshow"  disabled={saving} onClick={() => onStatusChange(booking.id, "no_show")}>No Show</button>}
                <button type="button" className="sched-status-btn sched-status-btn--cancel" disabled={saving} onClick={() => onStatusChange(booking.id, "cancelled")}>Cancel</button>
              </div>
            </div>
          )}

          {saveError && <div className="sched-error-banner">{saveError}</div>}
        </div>

        <div className="sched-modal-footer">
          <button type="button" className="sched-btn-ghost" onClick={onClose} style={{ flex: 1 }}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
