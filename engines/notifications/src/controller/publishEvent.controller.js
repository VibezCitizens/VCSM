// ============================================================
// Notifications Engine — Publish Event Controller
// ============================================================
// Main entry point for creating a notification event and processing it
// through the full pipeline: event → recipients → preferences → render → deliver.

import { createTrace, getRecipientResolver } from '../config.js'
import { dalInsertEvent } from '../dal/events.write.dal.js'
import { dalGetEventType } from '../dal/eventTypes.read.dal.js'
import { dalInsertRecipients } from '../dal/recipients.write.dal.js'
import { dalUpsertRendered } from '../dal/rendered.write.dal.js'
import { evaluatePreference } from '../services/preferenceEvaluator.service.js'
import { renderNotification } from '../services/templateRenderer.service.js'
import { deliverToRecipient } from '../services/deliveryOrchestrator.service.js'
import { emit, EVENTS } from '../events.js'

/**
 * Publish a notification event and process it through the full pipeline.
 *
 * @param {Object} params
 * @param {import('../types/index.js').PublishEventInput} params.event — event data
 * @param {import('../types/index.js').RecipientInput[]} [params.recipients] — explicit recipients (if not using injected resolver)
 * @param {Object} [params.renderContext] — additional context for template rendering (sender name, etc.)
 * @param {boolean} [params.skipPreferences] — skip preference evaluation (for system notifications)
 * @returns {Promise<{ eventId: string, recipientCount: number, deliveredCount: number, errors: string[] }>}
 */
export async function publishEvent({ event, recipients = [], renderContext = {}, skipPreferences = false }) {
  const trace = createTrace('publishEvent')
  const errors = []

  // Step 1: Validate event type exists
  trace.report({ step: 'VALIDATE_EVENT_TYPE', status: 'start', eventKey: event.eventKey })

  const eventType = await dalGetEventType({ eventKey: event.eventKey, trace })

  if (!eventType) {
    trace.report({ step: 'EVENT_TYPE_NOT_FOUND', status: 'warn', eventKey: event.eventKey })
    // Proceed anyway — allow ad-hoc events without registered types
  }

  // Step 2: Insert event
  const eventRow = await dalInsertEvent({
    eventKey: event.eventKey,
    sourceDomain: event.sourceDomain,
    sourceActorId: event.sourceActorId ?? null,
    sourceUserId: event.sourceUserId ?? null,
    objectDomain: event.objectDomain ?? null,
    objectType: event.objectType ?? null,
    objectId: event.objectId ?? null,
    parentObjectType: event.parentObjectType ?? null,
    parentObjectId: event.parentObjectId ?? null,
    appId: event.appId ?? null,
    realmId: event.realmId ?? null,
    visibility: event.visibility ?? 'private',
    payload: event.payload ?? {},
    trace,
  })

  const eventId = eventRow.id

  emit(EVENTS.EVENT_PUBLISHED, { eventId, eventKey: event.eventKey })

  // Step 3: Resolve recipients
  let resolvedRecipients = recipients

  if (resolvedRecipients.length === 0) {
    const injectedResolver = getRecipientResolver()
    if (injectedResolver) {
      try {
        resolvedRecipients = await injectedResolver({ ...event, id: eventId })
        trace.report({ step: 'RECIPIENTS_RESOLVED_VIA_DI', status: 'success', count: resolvedRecipients.length })
      } catch (err) {
        trace.report({ step: 'RECIPIENT_RESOLVER_ERROR', status: 'error', error: err })
        errors.push(`Recipient resolver failed: ${err.message}`)
      }
    }
  }

  if (resolvedRecipients.length === 0) {
    trace.report({ step: 'NO_RECIPIENTS', status: 'warn' })
    return { eventId, recipientCount: 0, deliveredCount: 0, errors }
  }

  // Step 4: Determine supported channels from event type
  const supportedChannels = eventType
    ? getSupportedChannels(eventType)
    : ['in_app']

  // Step 5: Expand recipients per channel
  const expandedRecipients = expandByChannels(resolvedRecipients, supportedChannels)

  emit(EVENTS.RECIPIENTS_RESOLVED, { eventId, count: expandedRecipients.length })

  // Step 6: Evaluate preferences and filter
  let allowedRecipients = expandedRecipients

  if (!skipPreferences) {
    const evaluated = await Promise.all(
      expandedRecipients.map(async (r) => {
        const actorId = r.recipientActorId
        if (!actorId) return { ...r, _allowed: true }

        const result = await evaluatePreference({
          recipientActorId: actorId,
          eventKey: event.eventKey,
          channel: r.deliveryChannel ?? 'in_app',
          trace,
        })

        return { ...r, _allowed: result.allowed, _prefReason: result.reason }
      })
    )

    allowedRecipients = evaluated.filter((r) => r._allowed)
    const skippedCount = evaluated.length - allowedRecipients.length

    if (skippedCount > 0) {
      trace.report({ step: 'PREFERENCES_FILTERED', status: 'success', skipped: skippedCount })
    }

    emit(EVENTS.PREFERENCES_EVALUATED, { eventId, allowed: allowedRecipients.length, skipped: skippedCount })
  }

  // Step 7: Insert recipient rows
  const recipientRows = await dalInsertRecipients({
    eventId,
    recipients: allowedRecipients,
    trace,
  })

  // Step 8: Render + deliver each recipient
  let deliveredCount = 0

  for (const recipientRow of recipientRows) {
    try {
      // Render
      const rendered = await renderNotification({
        eventKey: event.eventKey,
        channel: recipientRow.delivery_channel,
        locale: 'en',
        payload: event.payload ?? {},
        context: renderContext,
        trace,
      })

      // Persist rendered content
      await dalUpsertRendered({
        recipientId: recipientRow.id,
        templateId: rendered.templateId,
        locale: 'en',
        title: rendered.title,
        body: rendered.body,
        ctaLabel: rendered.ctaLabel,
        linkPath: rendered.linkPath,
        imageUrl: rendered.imageUrl,
        icon: rendered.icon,
        renderContext: rendered.renderContext,
        trace,
      })

      emit(EVENTS.RENDERED, { recipientId: recipientRow.id, eventId })

      // Deliver
      const result = await deliverToRecipient({ recipient: recipientRow, rendered, trace })

      if (result.success) {
        deliveredCount++
      } else {
        errors.push(`Delivery failed for ${recipientRow.id}: ${result.error}`)
      }
    } catch (err) {
      trace.report({ step: 'RECIPIENT_PROCESS_ERROR', status: 'error', recipientId: recipientRow.id, error: err })
      errors.push(`Processing failed for ${recipientRow.id}: ${err.message}`)
    }
  }

  trace.report({
    step: 'PUBLISH_COMPLETE',
    status: 'success',
    eventId,
    recipientCount: recipientRows.length,
    deliveredCount,
    errorCount: errors.length,
  })

  return { eventId, recipientCount: recipientRows.length, deliveredCount, errors }
}

/**
 * Extract supported channels from an event type.
 */
function getSupportedChannels(eventType) {
  const channels = []
  if (eventType.supports_in_app) channels.push('in_app')
  if (eventType.supports_email) channels.push('email')
  if (eventType.supports_sms) channels.push('sms')
  if (eventType.supports_push) channels.push('push')
  if (eventType.supports_webhook) channels.push('webhook')
  return channels.length > 0 ? channels : ['in_app']
}

/**
 * Expand recipients: if a recipient doesn't specify a channel, create
 * one entry per supported channel. If they do, keep as-is.
 */
function expandByChannels(recipients, supportedChannels) {
  const expanded = []
  for (const r of recipients) {
    if (r.deliveryChannel) {
      if (supportedChannels.includes(r.deliveryChannel)) {
        expanded.push(r)
      }
    } else {
      for (const ch of supportedChannels) {
        expanded.push({ ...r, deliveryChannel: ch })
      }
    }
  }
  return expanded
}
