import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { listVportServicesByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportServices.read.dal";
import { createOwnerBookingController } from "@/features/dashboard/vport/controller/createOwnerBooking.controller";

const DURATIONS = [15, 20, 30, 45, 60, 75, 90, 120];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nowRoundedTime() {
  const d = new Date();
  const m = Math.ceil((d.getHours() * 60 + d.getMinutes()) / 30) * 30;
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function buildIso(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

function addMinutes(isoStr, mins) {
  return new Date(new Date(isoStr).getTime() + mins * 60_000).toISOString();
}

const inputStyle = {
  width: "100%", height: 44, borderRadius: 10, boxSizing: "border-box",
  border: "1px solid rgba(148,163,184,.18)",
  background: "rgba(2,6,23,.8)", color: "#f8fafc", fontSize: 14,
  padding: "0 14px", outline: "none",
};
const selectStyle = { ...inputStyle, WebkitAppearance: "none", appearance: "none" };
const labelStyle  = { fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,.45)", letterSpacing: ".06em", marginBottom: 6, display: "block" };
const fieldStyle  = { display: "grid", gap: 0 };
const rowStyle    = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };

export default function QuickBookingModal({ actorId, resourceId, profileId, onClose, onCreated }) {
  const [services, setServices] = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const [form, setForm] = useState({
    date:            todayStr(),
    startTime:       nowRoundedTime(),
    durationMinutes: 30,
    serviceId:       "",
    customerName:    "",
    customerNote:    "",
  });

  const firstRef = useRef(null);

  useEffect(() => {
    setTimeout(() => firstRef.current?.focus(), 80);
    if (!profileId) return;
    listVportServicesByProfileIdDAL({ profileId }).then(setServices).catch(() => {});
  }, [profileId]);

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  function onServiceChange(e) {
    const id  = e.target.value;
    const svc = services.find((s) => s.id === id);
    const dur = svc?.meta?.duration_minutes;
    setForm((f) => ({
      ...f,
      serviceId:       id,
      durationMinutes: dur > 0 ? Number(dur) : f.durationMinutes,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const startsAt = buildIso(form.date, form.startTime);
      const endsAt   = addMinutes(startsAt, Number(form.durationMinutes));
      const svc      = services.find((s) => s.id === form.serviceId);
      await createOwnerBookingController({
        actorId,
        resourceId,
        serviceId:            form.serviceId || null,
        startsAt,
        endsAt,
        durationMinutes:      Number(form.durationMinutes),
        serviceLabelSnapshot: svc?.label ?? svc?.key ?? "Appointment",
        customerName:         form.customerName.trim() || null,
        customerNote:         form.customerNote.trim() || null,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to create booking.");
    } finally {
      setSaving(false);
    }
  }

  const overlayStyle = {
    position: "fixed", inset: 0, zIndex: 10001,
    background: "rgba(0,0,0,.7)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
  };
  const sheetStyle = {
    width: "100%", maxWidth: 520,
    background: "rgba(9,13,27,.98)", borderRadius: "20px 20px 0 0",
    border: "1px solid rgba(148,163,184,.1)", borderBottom: "none",
    maxHeight: "90dvh", display: "flex", flexDirection: "column", overflow: "hidden",
  };

  return createPortal(
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={sheetStyle}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,.12)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 14px", borderBottom: "1px solid rgba(148,163,184,.08)" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,.9)" }}>New Booking</div>
          <button type="button" onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.5)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: "16px 18px 0", display: "grid", gap: 14 }}>
          {/* Date + Start time */}
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>DATE</label>
              <input ref={firstRef} type="date" value={form.date} onChange={set("date")} required style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>START TIME</label>
              <input type="time" value={form.startTime} onChange={set("startTime")} required style={inputStyle} />
            </div>
          </div>

          {/* Duration + Service */}
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>DURATION</label>
              <select value={form.durationMinutes} onChange={set("durationMinutes")} style={selectStyle}>
                {DURATIONS.map((d) => <option key={d} value={d} style={{ background: "#0f172a" }}>{d} min</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>SERVICE</label>
              <select value={form.serviceId} onChange={onServiceChange} style={selectStyle}>
                <option value="" style={{ background: "#0f172a" }}>— Appointment —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id} style={{ background: "#0f172a" }}>
                    {s.label ?? s.key}{s.meta?.duration_minutes ? ` (${s.meta.duration_minutes}m)` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer name */}
          <div style={fieldStyle}>
            <label style={labelStyle}>CLIENT NAME</label>
            <input type="text" value={form.customerName} onChange={set("customerName")} placeholder="Walk-in (optional)" style={inputStyle} />
          </div>

          {/* Note */}
          <div style={fieldStyle}>
            <label style={labelStyle}>NOTE (optional)</label>
            <textarea value={form.customerNote} onChange={set("customerNote")} placeholder="Phone, instructions, etc." rows={2} style={{ ...inputStyle, height: "auto", padding: "10px 14px", resize: "none", lineHeight: 1.5 }} />
          </div>

          {error && (
            <div style={{ borderRadius: 8, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", padding: "9px 12px", fontSize: 12, color: "#fca5a5" }}>
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{ padding: "14px 18px", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)", borderTop: "1px solid rgba(148,163,184,.07)" }}>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={saving}
            style={{
              width: "100%", height: 52, borderRadius: 14, border: "none",
              fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              background: saving ? "rgba(139,92,246,.22)" : "linear-gradient(135deg,rgba(139,92,246,.95),rgba(109,40,217,.95))",
              color: saving ? "rgba(167,139,250,.4)" : "#fff",
              transition: "all .15s",
            }}
          >
            {saving ? "Creating…" : "Book Appointment"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
