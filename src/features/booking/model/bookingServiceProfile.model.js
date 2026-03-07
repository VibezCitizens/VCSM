export function mapBookingServiceProfileRow(row) {
  if (!row) return null;

  return {
    serviceId: row.service_id ?? null,
    durationMinutes: Number.isFinite(Number(row.duration_minutes))
      ? Number(row.duration_minutes)
      : 0,
    paddingBeforeMinutes: Number.isFinite(Number(row.padding_before_minutes))
      ? Number(row.padding_before_minutes)
      : 0,
    paddingAfterMinutes: Number.isFinite(Number(row.padding_after_minutes))
      ? Number(row.padding_after_minutes)
      : 0,
    bookingMode: row.booking_mode ?? "appointment",
    maxConcurrent: Number.isFinite(Number(row.max_concurrent))
      ? Number(row.max_concurrent)
      : 1,
    isBookable: row.is_bookable === true,
    priceCents: row.price_cents ?? null,
    currencyCode: row.currency_code ?? "USD",
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function mapBookingServiceProfileRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapBookingServiceProfileRow).filter(Boolean);
}

export default mapBookingServiceProfileRow;
