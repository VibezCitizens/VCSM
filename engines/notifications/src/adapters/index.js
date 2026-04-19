// ============================================================
// Notifications Engine — Public API
// ============================================================
// This is the ONLY file that defines the engine's public surface.
// All external consumers import from here (via engines/notifications/index.js).
// ============================================================

// Configuration
export { configureNotificationsEngine } from '../config.js'

// Events
export { EVENTS, on as onNotificationEvent, emit } from '../events.js'

// Controllers
export { publishEvent }              from '../controller/publishEvent.controller.js'
export { getInboxNotifications }     from '../controller/getInbox.controller.js'
export { markSeen, markRead, dismiss, archive } from '../controller/inboxState.controller.js'
export { countUnread, invalidateCountUnreadCache } from '../controller/countUnread.controller.js'

// Services (for advanced use / direct access)
export { evaluatePreference }        from '../services/preferenceEvaluator.service.js'
export { renderNotification }        from '../services/templateRenderer.service.js'
export { deliverToRecipient }        from '../services/deliveryOrchestrator.service.js'

// Observability
export {
  createPipelineTracer,
  getPipelineTraces,
  getPipelineSummaries,
  getLatestPipeline,
  clearPipelineTraces,
  subscribePipelineTraces,
  exportTraceSnapshot,
  formatPipelineTrace,
} from '../services/trace.service.js'

// Models (public contract shapes)
export { EventModel }                from '../model/Event.model.js'
export { RecipientModel }            from '../model/Recipient.model.js'
export { InboxItemModel }            from '../model/InboxItem.model.js'
export { RenderedModel }             from '../model/Rendered.model.js'
export { TemplateModel }             from '../model/Template.model.js'
export { PreferenceModel }           from '../model/Preference.model.js'
export { DeliveryAttemptModel }      from '../model/DeliveryAttempt.model.js'
