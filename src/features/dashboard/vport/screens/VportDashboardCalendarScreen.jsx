// src/features/dashboard/vport/screens/VportDashboardCalendarScreen.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/model/vportDashboardShellStyles";
import {
  useBookingAvailability,
  useEnsureOwnerBookingResource,
  useManageAvailability,
  useOwnerBookingResources,
} from "@/features/booking/adapters/booking.adapter";

const WEEKDAY_OPTIONS = Object.freeze([
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]);

function pad2(value) {
  return String(value).padStart(2, "0");
}

function normalizeTimeInput(value, fallback = "09:00") {
  const [rawHour = "", rawMinute = ""] = String(value || "").trim().split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallback;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;

  return `${pad2(hour)}:${pad2(minute)}`;
}

function timeToMinutes(value) {
  const [hour = "0", minute = "0"] = String(value || "").split(":");
  return Number(hour) * 60 + Number(minute);
}

function minutesToTime(value) {
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
}

function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatShortDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildWeeksWindow(weeks) {
  const count = Math.min(4, Math.max(1, Number(weeks) || 1));
  const from = startOfDay(new Date());
  const until = addDays(from, count * 7 - 1);
  return {
    weeks: count,
    validFrom: toDateKey(from),
    validUntil: toDateKey(until),
    label: `${formatShortDate(from)} - ${formatShortDate(until)}`,
  };
}

function weekdayLabel(weekday) {
  return WEEKDAY_OPTIONS.find((x) => x.value === Number(weekday))?.label ?? "Day";
}

function defaultOpenForWeekday(weekday) {
  return Number(weekday) >= 1 && Number(weekday) <= 5;
}

function buildDefaultDaySchedule(weekday) {
  return {
    weekday: Number(weekday),
    isOpen: defaultOpenForWeekday(weekday),
    clockIn: "09:00",
    lunchOut: "12:00",
    lunchIn: "13:00",
    clockOut: "17:00",
  };
}

function toSortedRules(rows) {
  return [...(Array.isArray(rows) ? rows : [])].sort(
    (a, b) => timeToMinutes(a?.startTime) - timeToMinutes(b?.startTime)
  );
}

function midpointTime(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return startTime;

  const midpoint = Math.round((start + (end - start) / 2) / 30) * 30;
  const clamped = Math.min(end, Math.max(start, midpoint));
  return minutesToTime(clamped);
}

function buildDayScheduleFromRules(weekday, rulesForDay) {
  const fallback = buildDefaultDaySchedule(weekday);
  const sorted = toSortedRules(rulesForDay);
  if (!sorted.length) return fallback;

  if (sorted.length === 1) {
    const only = sorted[0];
    const clockIn = normalizeTimeInput(only?.startTime, fallback.clockIn);
    const clockOut = normalizeTimeInput(only?.endTime, fallback.clockOut);
    const breakPoint = midpointTime(clockIn, clockOut);

    return {
      weekday,
      isOpen: true,
      clockIn,
      lunchOut: breakPoint,
      lunchIn: breakPoint,
      clockOut,
    };
  }

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const clockIn = normalizeTimeInput(first?.startTime, fallback.clockIn);
  const lunchOut = normalizeTimeInput(first?.endTime, fallback.lunchOut);
  const lunchInRaw = normalizeTimeInput(last?.startTime, fallback.lunchIn);
  const clockOut = normalizeTimeInput(last?.endTime, fallback.clockOut);
  const lunchIn =
    timeToMinutes(lunchInRaw) < timeToMinutes(lunchOut) ? lunchOut : lunchInRaw;

  return {
    weekday,
    isOpen: true,
    clockIn,
    lunchOut,
    lunchIn,
    clockOut,
  };
}

function isWeeklyRule(rule) {
  if (!rule) return false;
  const type = String(rule?.ruleType ?? "weekly").toLowerCase();
  return type === "weekly";
}

function buildRulesByWeekday(rules) {
  const byDay = new Map(WEEKDAY_OPTIONS.map((d) => [d.value, []]));

  (Array.isArray(rules) ? rules : []).forEach((rule) => {
    if (!isWeeklyRule(rule)) return;
    const weekday = Number(rule?.weekday);
    if (!byDay.has(weekday)) return;
    byDay.get(weekday).push(rule);
  });

  WEEKDAY_OPTIONS.forEach((day) => {
    byDay.set(day.value, toSortedRules(byDay.get(day.value)));
  });

  return byDay;
}

function buildWeekSchedule(rulesByWeekday) {
  return WEEKDAY_OPTIONS.map((day) =>
    buildDayScheduleFromRules(day.value, rulesByWeekday.get(day.value) ?? [])
  );
}

function buildDaySegments(daySchedule) {
  if (!daySchedule?.isOpen) return { segments: [], error: null };

  const clockIn = normalizeTimeInput(daySchedule.clockIn, "09:00");
  const lunchOut = normalizeTimeInput(daySchedule.lunchOut, "12:00");
  const lunchIn = normalizeTimeInput(daySchedule.lunchIn, "13:00");
  const clockOut = normalizeTimeInput(daySchedule.clockOut, "17:00");

  if (timeToMinutes(clockOut) <= timeToMinutes(clockIn)) {
    return { segments: null, error: "Clock out must be after clock in." };
  }

  if (timeToMinutes(lunchOut) < timeToMinutes(clockIn)) {
    return { segments: null, error: "Lunch clock-out cannot be before clock in." };
  }
  if (timeToMinutes(lunchIn) > timeToMinutes(clockOut)) {
    return { segments: null, error: "Lunch clock-in cannot be after clock out." };
  }
  if (timeToMinutes(lunchOut) > timeToMinutes(lunchIn)) {
    return { segments: null, error: "Lunch clock-in must be at or after lunch clock-out." };
  }

  const segments = [];
  if (timeToMinutes(clockIn) < timeToMinutes(lunchOut)) {
    segments.push({ startTime: clockIn, endTime: lunchOut });
  }
  if (timeToMinutes(lunchIn) < timeToMinutes(clockOut)) {
    segments.push({ startTime: lunchIn, endTime: clockOut });
  }

  if (!segments.length) {
    segments.push({ startTime: clockIn, endTime: clockOut });
  }

  return { segments, error: null };
}

function TimeField({ label, value, disabled, inputStyle, onChange }) {
  return (
    <label style={{ minWidth: 120, display: "grid", gap: 4 }}>
      <span style={{ color: "rgba(203, 213, 225, 0.9)", fontSize: 12 }}>{label}</span>
      <input
        type="time"
        step={1800}
        disabled={disabled}
        style={inputStyle}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

export function VportDashboardCalendarScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity, identityLoading } = useIdentity();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);
  const viewerActorId = identity?.actorId ?? null;
  const isDesktop = useDesktopBreakpoint();
  const isOwner =
    Boolean(actorId) &&
    Boolean(viewerActorId) &&
    String(viewerActorId) === String(actorId);

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  const resources = useOwnerBookingResources({
    ownerActorId: actorId,
    includeInactive: true,
    enabled: isOwner && Boolean(actorId),
  });
  const {
    isPending: ensureResourcePending,
    error: ensureResourceError,
    ensure: ensureOwnerResource,
  } = useEnsureOwnerBookingResource();
  const didTryBootstrapRef = useRef(false);

  const resourceId = resources.primary?.id ?? null;
  const resourcesLoading = resources.loading;
  const resourcesError = resources.error;
  const refreshResources = resources.refresh;

  const [rangeAnchor] = useState(() => new Date());
  const rangeStart = useMemo(() => startOfMonth(rangeAnchor).toISOString(), [rangeAnchor]);
  const rangeEnd = useMemo(() => endOfMonth(rangeAnchor).toISOString(), [rangeAnchor]);

  const availability = useBookingAvailability({
    resourceId,
    rangeStart,
    rangeEnd,
    enabled: Boolean(resourceId) && isOwner,
  });

  const manageAvailability = useManageAvailability();
  const rules = useMemo(
    () => (Array.isArray(availability.data?.rules) ? availability.data.rules : []),
    [availability.data?.rules]
  );
  const managedRulesByWeekday = useMemo(() => buildRulesByWeekday(rules), [rules]);

  const [weekSchedule, setWeekSchedule] = useState(() =>
    WEEKDAY_OPTIONS.map((day) => buildDefaultDaySchedule(day.value))
  );
  const [applyWeeks, setApplyWeeks] = useState(4);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavingAll, setIsSavingAll] = useState(false);
  const weeksWindow = useMemo(() => buildWeeksWindow(applyWeeks), [applyWeeks]);

  useEffect(() => {
    didTryBootstrapRef.current = false;
  }, [actorId]);

  useEffect(() => {
    if (!isOwner || !actorId || !viewerActorId) return;
    if (resourcesLoading || resourcesError) return;
    if (resourceId) return;
    if (ensureResourcePending) return;
    if (didTryBootstrapRef.current) return;

    didTryBootstrapRef.current = true;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    (async () => {
      const result = await ensureOwnerResource({
        requestActorId: viewerActorId,
        ownerActorId: actorId,
        timezone,
      });

      if (result?.ok) {
        await refreshResources();
      }
    })();
  }, [
    isOwner,
    actorId,
    viewerActorId,
    resourcesLoading,
    resourcesError,
    refreshResources,
    resourceId,
    ensureResourcePending,
    ensureOwnerResource,
  ]);

  useEffect(() => {
    setWeekSchedule(buildWeekSchedule(managedRulesByWeekday));
  }, [managedRulesByWeekday]);

  const setDayPatch = useCallback((weekday, patch) => {
    setWeekSchedule((prev) =>
      prev.map((day) =>
        Number(day.weekday) === Number(weekday) ? { ...day, ...patch } : day
      )
    );
  }, []);

  const applyDaySchedule = useCallback(
    async (day, windowRange) => {
      if (!resourceId || !viewerActorId) {
        return { ok: false, error: "Missing booking resource." };
      }

      const weekday = Number(day?.weekday);
      const validFrom = windowRange?.validFrom;
      const validUntil = windowRange?.validUntil;
      const existing = [...(managedRulesByWeekday.get(weekday) ?? [])];

      if (!day?.isOpen) {
        for (const rule of existing) {
          if (!rule?.id || rule?.isActive === false) continue;

          const res = await manageAvailability.setAvailabilityRule({
            requestActorId: viewerActorId,
            ruleId: rule.id,
            resourceId,
            ruleType: "weekly",
            weekday,
            startTime: normalizeTimeInput(rule.startTime, "09:00"),
            endTime: normalizeTimeInput(rule.endTime, "17:00"),
            isActive: false,
          });

          if (!res?.ok) {
            return {
              ok: false,
              error: String(res?.error?.message ?? res?.error ?? "Failed to close day."),
            };
          }
        }
        return { ok: true, error: null };
      }

      const { segments, error } = buildDaySegments(day);
      if (error) return { ok: false, error };

      for (let i = 0; i < segments.length; i += 1) {
        const existingRule = existing[i] ?? null;
        const segment = segments[i];

        const res = await manageAvailability.setAvailabilityRule({
          requestActorId: viewerActorId,
          ruleId: existingRule?.id ?? undefined,
          resourceId,
          ruleType: "weekly",
          weekday,
          startTime: segment.startTime,
          endTime: segment.endTime,
          validFrom,
          validUntil,
          isActive: true,
        });

        if (!res?.ok) {
          return {
            ok: false,
            error: String(res?.error?.message ?? res?.error ?? "Failed to save day."),
          };
        }
      }

      for (let i = segments.length; i < existing.length; i += 1) {
        const existingRule = existing[i];
        if (!existingRule?.id || existingRule?.isActive === false) continue;

        const res = await manageAvailability.setAvailabilityRule({
          requestActorId: viewerActorId,
          ruleId: existingRule.id,
          resourceId,
          ruleType: "weekly",
          weekday,
          startTime: normalizeTimeInput(existingRule.startTime, "09:00"),
          endTime: normalizeTimeInput(existingRule.endTime, "17:00"),
          isActive: false,
        });

        if (!res?.ok) {
          return {
            ok: false,
            error: String(res?.error?.message ?? res?.error ?? "Failed to update day rules."),
          };
        }
      }

      return { ok: true, error: null };
    },
    [resourceId, viewerActorId, managedRulesByWeekday, manageAvailability]
  );

  const saveWeeklySchedule = useCallback(async () => {
    if (!resourceId || !viewerActorId) return;

    setStatusMessage("");
    setErrorMessage("");
    setIsSavingAll(true);

    try {
      for (const day of weekSchedule) {
        const res = await applyDaySchedule(day, weeksWindow);
        if (!res?.ok) {
          throw new Error(`${weekdayLabel(day.weekday)}: ${res?.error ?? "Failed to save."}`);
        }
      }

      await availability.refresh();
      setStatusMessage(
        `Schedule saved for ${weeksWindow.weeks} week${weeksWindow.weeks === 1 ? "" : "s"} (${weeksWindow.label}).`
      );
    } catch (error) {
      setErrorMessage(String(error?.message ?? error));
    } finally {
      setIsSavingAll(false);
    }
  }, [resourceId, viewerActorId, weekSchedule, applyDaySchedule, weeksWindow, availability]);

  if (identityLoading) {
    return <div className="p-10 text-center text-neutral-400">Loading...</div>;
  }
  if (!identity) {
    return <div className="p-10 text-center text-neutral-400">Sign in required.</div>;
  }
  if (!actorId) {
    return <div className="p-10 text-center text-neutral-400">Invalid vport.</div>;
  }
  if (!isOwner) {
    return (
      <div className="p-10 text-center text-neutral-400">
        You can only manage calendar settings for your own vport.
      </div>
    );
  }

  const shell = createVportDashboardShellStyles({
    isDesktop,
    maxWidthDesktop: 1140,
  });

  const inputStyle = {
    width: "100%",
    borderRadius: 10,
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "rgba(2, 6, 23, 0.7)",
    color: "#e2e8f0",
    fontSize: 14,
    padding: "8px 10px",
    opacity: 1,
  };

  const buttonStyle = {
    borderRadius: 10,
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "rgba(15, 23, 42, 0.95)",
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: 600,
    padding: "9px 12px",
    cursor: "pointer",
  };
  const toggleShellStyle = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    border: "1px solid rgba(148, 163, 184, 0.35)",
    overflow: "hidden",
    width: "fit-content",
  };

  const cardStyle = {
    borderRadius: 16,
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(2, 6, 23, 0.65)",
    padding: 16,
    display: "grid",
    gap: 12,
  };

  const busy =
    manageAvailability.isPending ||
    isSavingAll ||
    ensureResourcePending ||
    resourcesLoading;
  const hasResource = Boolean(resourceId);

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={goBack} style={shell.btn("soft")} />
            <div style={shell.title}>CALENDAR SETTINGS</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16, display: "grid", gap: 12 }}>
            <section style={cardStyle}>
              <div>
                <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Working Hours</div>
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "end",
                    gap: 10,
                  }}
                >
                  <label style={{ minWidth: 220, display: "grid", gap: 4 }}>
                    <span style={{ color: "rgba(203, 213, 225, 0.9)", fontSize: 12 }}>
                      Apply to next weeks
                    </span>
                    <select
                      value={applyWeeks}
                      disabled={busy}
                      onChange={(e) => setApplyWeeks(Number(e.target.value))}
                      style={inputStyle}
                    >
                      <option value={1}>1 week</option>
                      <option value={2}>2 weeks</option>
                      <option value={3}>3 weeks</option>
                      <option value={4}>4 weeks</option>
                    </select>
                  </label>

                  <div style={{ color: "rgba(191, 219, 254, 0.95)", fontSize: 12, marginBottom: 2 }}>
                    Date range: <strong style={{ color: "#f8fafc" }}>{weeksWindow.label}</strong>
                  </div>
                </div>
              </div>

              {resourcesLoading ? (
                <div style={{ color: "rgba(203, 213, 225, 0.85)", fontSize: 13 }}>
                  Loading booking resources...
                </div>
              ) : null}

              {ensureResourcePending ? (
                <div style={{ color: "rgba(203, 213, 225, 0.85)", fontSize: 13 }}>
                  Creating default booking resource...
                </div>
              ) : null}

              {resourcesError ? (
                <div style={{ color: "#fecaca", fontSize: 13 }}>
                  {String(resourcesError?.message ?? resourcesError)}
                </div>
              ) : null}

              {ensureResourceError ? (
                <div style={{ color: "#fecaca", fontSize: 13 }}>
                  {String(ensureResourceError?.message ?? ensureResourceError)}
                </div>
              ) : null}

              {availability.error ? (
                <div style={{ color: "#fecaca", fontSize: 13 }}>
                  {String(availability.error?.message ?? availability.error)}
                </div>
              ) : null}

              {!hasResource ? (
                ensureResourcePending ? null : (
                  <div style={{ color: "rgba(203, 213, 225, 0.9)", fontSize: 13 }}>
                    No booking resource found for this vport yet.
                  </div>
                )
              ) : (
                <>
                  <div style={{ display: "grid", gap: 10 }}>
                    {weekSchedule.map((day) => (
                      <div
                        key={day.weekday}
                        style={{
                          borderRadius: 12,
                          border: "1px solid rgba(148, 163, 184, 0.24)",
                          background: "rgba(15, 23, 42, 0.64)",
                          padding: 10,
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gap: 8,
                            alignItems: "end",
                            gridTemplateColumns: isDesktop
                              ? "180px repeat(4, minmax(0, 1fr))"
                              : "repeat(2, minmax(0, 1fr))",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gap: 6,
                              gridColumn: isDesktop ? "auto" : "1 / -1",
                            }}
                          >
                            <div style={{ color: "#f8fafc", fontSize: 15, fontWeight: 700 }}>
                              {weekdayLabel(day.weekday)}
                            </div>
                            <div style={{ display: "grid", gap: 4 }}>
                              <span style={{ color: "rgba(203, 213, 225, 0.88)", fontSize: 12 }}>
                                Day status
                              </span>
                              <div style={toggleShellStyle}>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setDayPatch(day.weekday, { isOpen: true })}
                                  style={{
                                    border: "none",
                                    padding: "6px 10px",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: day.isOpen ? "#f8fafc" : "rgba(203, 213, 225, 0.85)",
                                    background: day.isOpen
                                      ? "linear-gradient(135deg, rgba(34, 197, 94, 0.45), rgba(22, 163, 74, 0.45))"
                                      : "rgba(15, 23, 42, 0.75)",
                                  }}
                                >
                                  Open
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setDayPatch(day.weekday, { isOpen: false })}
                                  style={{
                                    border: "none",
                                    padding: "6px 10px",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: !day.isOpen ? "#f8fafc" : "rgba(203, 213, 225, 0.85)",
                                    background: !day.isOpen
                                      ? "linear-gradient(135deg, rgba(239, 68, 68, 0.45), rgba(220, 38, 38, 0.45))"
                                      : "rgba(15, 23, 42, 0.75)",
                                  }}
                                >
                                  Closed
                                </button>
                              </div>
                            </div>
                          </div>

                          <TimeField
                            label="Clock In"
                            inputStyle={inputStyle}
                            disabled={!day.isOpen || busy}
                            value={day.clockIn}
                            onChange={(e) =>
                              setDayPatch(day.weekday, {
                                clockIn: normalizeTimeInput(e.target.value, day.clockIn),
                              })
                            }
                          />

                          <TimeField
                            label="Lunch Clock-Out"
                            inputStyle={inputStyle}
                            disabled={!day.isOpen || busy}
                            value={day.lunchOut}
                            onChange={(e) =>
                              setDayPatch(day.weekday, {
                                lunchOut: normalizeTimeInput(e.target.value, day.lunchOut),
                              })
                            }
                          />

                          <TimeField
                            label="Lunch Clock-In"
                            inputStyle={inputStyle}
                            disabled={!day.isOpen || busy}
                            value={day.lunchIn}
                            onChange={(e) =>
                              setDayPatch(day.weekday, {
                                lunchIn: normalizeTimeInput(e.target.value, day.lunchIn),
                              })
                            }
                          />

                          <TimeField
                            label="Clock Out"
                            inputStyle={inputStyle}
                            disabled={!day.isOpen || busy}
                            value={day.clockOut}
                            onChange={(e) =>
                              setDayPatch(day.weekday, {
                                clockOut: normalizeTimeInput(e.target.value, day.clockOut),
                              })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button
                      type="button"
                      style={buttonStyle}
                      disabled={busy}
                      onClick={saveWeeklySchedule}
                    >
                      Save weeks window
                    </button>
                  </div>
                </>
              )}

              {statusMessage ? (
                <div style={{ color: "#86efac", fontSize: 13 }}>{statusMessage}</div>
              ) : null}

              {errorMessage ? (
                <div style={{ color: "#fecaca", fontSize: 13 }}>{errorMessage}</div>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          overflow: "auto",
          background: "#000",
        }}
      >
        {content}
      </div>,
      document.body
    );
  }

  return content;
}

export default VportDashboardCalendarScreen;
