export function mapBookingRow(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    resourceId: row.resource_id ?? null,
    serviceId: row.service_id ?? null,
    customerActorId: row.customer_actor_id ?? null,
    customerProfileId: row.customer_profile_id ?? null,
    status: row.status ?? "pending",
    source: row.source ?? "public",
    startsAt: row.starts_at ?? null,
    endsAt: row.ends_at ?? null,
    timezone: row.timezone ?? "UTC",
    serviceLabelSnapshot: row.service_label_snapshot ?? "",
    durationMinutes: Number.isFinite(Number(row.duration_minutes))
      ? Number(row.duration_minutes)
      : 0,
    customerName: row.customer_name ?? null,
    customerPhone: row.customer_phone ?? null,
    customerEmail: row.customer_email ?? null,
    customerNote: row.customer_note ?? null,
    internalNote: row.internal_note ?? null,
    cancelledAt: row.cancelled_at ?? null,
    completedAt: row.completed_at ?? null,
    createdByActorId: row.created_by_actor_id ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function mapBookingRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapBookingRow).filter(Boolean);
}

export default mapBookingRow;
