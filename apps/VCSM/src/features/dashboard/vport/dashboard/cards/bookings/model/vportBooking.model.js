export function mapBooking(b) {
  return {
    id:                   b.id,
    resourceId:           b.resource_id,
    serviceId:            b.service_id,
    customerActorId:      b.customer_actor_id,
    status:               b.status,
    source:               b.source,
    startsAt:             b.starts_at,
    endsAt:               b.ends_at,
    timezone:             b.timezone,
    serviceLabelSnapshot: b.service_label_snapshot,
    durationMinutes:      b.duration_minutes,
    customerName:         b.customer_name,
    customerNote:         b.customer_note,
    createdAt:            b.created_at,
    updatedAt:            b.updated_at,
  };
}
