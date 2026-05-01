export function mapNotificationInboxRows({
  recipientRows = [],
  events = [],
  renderedRows = [],
  inboxRows = [],
} = {}) {
  const eventById = new Map(events.map((row) => [row.id, row]))
  const renderedByRecipientId = new Map(renderedRows.map((row) => [row.recipient_id, row]))
  const inboxByRecipientId = new Map(inboxRows.map((row) => [row.recipient_id, row]))

  return recipientRows.map((recipient) => {
    const event = eventById.get(recipient.event_id)
    const rendered = renderedByRecipientId.get(recipient.id)
    const inbox = inboxByRecipientId.get(recipient.id)

    return {
      recipientId: recipient.id,
      eventId: recipient.event_id,
      eventKey: event?.event_key ?? null,
      sourceDomain: event?.source_domain ?? recipient.recipient_domain ?? null,
      sourceActorId: event?.source_actor_id ?? null,
      objectType: event?.object_type ?? null,
      objectId: event?.object_id ?? null,
      payload: event?.payload ?? {},
      eventCreatedAt: event?.created_at ?? recipient.created_at ?? null,
      deliveryChannel: recipient.delivery_channel ?? null,
      inboxBucket: recipient.inbox_bucket ?? null,
      priority: recipient.priority ?? null,
      status: recipient.status ?? null,
      title: rendered?.title ?? null,
      body: rendered?.body ?? null,
      ctaLabel: rendered?.cta_label ?? null,
      linkPath: rendered?.link_path ?? null,
      imageUrl: rendered?.image_url ?? null,
      icon: rendered?.icon ?? null,
      isSeen: inbox?.is_seen ?? false,
      isRead: inbox?.is_read ?? false,
      isOpened: inbox?.is_opened ?? false,
      isDismissed: inbox?.is_dismissed ?? false,
      badgeCounted: inbox?.badge_counted ?? true,
      archivedAt: inbox?.archived_at ?? null,
      snoozedUntil: inbox?.snoozed_until ?? null,
    }
  })
}
