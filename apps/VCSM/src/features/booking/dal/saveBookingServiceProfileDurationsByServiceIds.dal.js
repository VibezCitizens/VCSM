import { supabase } from "@/services/supabase/supabaseClient";

const BOOKING_SERVICE_PROFILE_SELECT = [
  "service_id",
  "duration_minutes",
  "padding_before_minutes",
  "padding_after_minutes",
  "booking_mode",
  "max_concurrent",
  "is_bookable",
  "price_cents",
  "currency_code",
  "created_at",
  "updated_at",
].join(",");

function normalizeServiceIds(serviceIds) {
  return [...new Set((Array.isArray(serviceIds) ? serviceIds : []).filter(Boolean).map(String))];
}

function normalizeDurationMinutes(value, fallback = 30) {
  const minutes = Math.floor(Number(value));
  if (!Number.isFinite(minutes) || minutes < 5) return fallback;
  return Math.min(240, minutes);
}

export async function saveBookingServiceProfileDurationsByServiceIdsDAL({
  serviceIds,
  durationMinutes,
} = {}) {
  const ids = normalizeServiceIds(serviceIds);
  if (!ids.length) {
    throw new Error("saveBookingServiceProfileDurationsByServiceIdsDAL: serviceIds are required");
  }

  const normalizedDuration = normalizeDurationMinutes(durationMinutes, 30);

  const { data: existingRows, error: existingError } = await supabase
    .schema("vc")
    .from("booking_service_profiles")
    .select("service_id")
    .in("service_id", ids);
  if (existingError) throw existingError;

  const existingIds = (Array.isArray(existingRows) ? existingRows : [])
    .map((row) => row?.service_id)
    .filter(Boolean)
    .map(String);
  const existingSet = new Set(existingIds);

  let updatedRows = [];
  if (existingIds.length > 0) {
    const { data, error } = await supabase
      .schema("vc")
      .from("booking_service_profiles")
      .update({
        duration_minutes: normalizedDuration,
      })
      .in("service_id", existingIds)
      .select(BOOKING_SERVICE_PROFILE_SELECT);
    if (error) throw error;
    updatedRows = Array.isArray(data) ? data : [];
  }

  const missingIds = ids.filter((id) => !existingSet.has(String(id)));
  let insertedRows = [];
  if (missingIds.length > 0) {
    const rows = missingIds.map((serviceId) => ({
      service_id: serviceId,
      duration_minutes: normalizedDuration,
      padding_before_minutes: 0,
      padding_after_minutes: 0,
      booking_mode: "appointment",
      max_concurrent: 1,
      is_bookable: true,
    }));

    const { data, error } = await supabase
      .schema("vc")
      .from("booking_service_profiles")
      .insert(rows)
      .select(BOOKING_SERVICE_PROFILE_SELECT);
    if (error) throw error;
    insertedRows = Array.isArray(data) ? data : [];
  }

  const byServiceId = new Map(
    [...updatedRows, ...insertedRows]
      .filter(Boolean)
      .map((row) => [String(row.service_id), row])
  );

  return ids.map((id) => byServiceId.get(String(id))).filter(Boolean);
}

export default saveBookingServiceProfileDurationsByServiceIdsDAL;
