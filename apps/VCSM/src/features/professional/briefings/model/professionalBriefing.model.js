const DOMAIN_BY_OBJECT_TYPE = Object.freeze({
  message: 'operations',
  conversation: 'operations',
  post: 'intelligence',
  comment: 'intelligence',
  review: 'marketplace',
  vport_review: 'marketplace',
  report: 'compliance',
  moderation_action: 'compliance',
})

const DOMAIN_BY_KIND = Object.freeze({
  message: 'operations',
  mention: 'intelligence',
  comment: 'intelligence',
  report: 'compliance',
  moderation: 'compliance',
  review: 'marketplace',
})

const PRIORITY_BY_DOMAIN = Object.freeze({
  operations: 'high',
  compliance: 'critical',
  marketplace: 'medium',
  intelligence: 'low',
})

function asPlainText(value) {
  if (typeof value === 'string') return value.trim()
  if (!value || typeof value !== 'object') return ''

  const candidate = value.title || value.message || value.body || value.summary || ''
  return typeof candidate === 'string' ? candidate.trim() : ''
}

function resolveDomain({ kind, objectType }) {
  return DOMAIN_BY_OBJECT_TYPE[objectType] || DOMAIN_BY_KIND[kind] || 'operations'
}

export function modelProfessionalBriefingRow(row) {
  if (!row?.id) return null

  const kind = String(row.kind || '').toLowerCase()
  const objectType = String(row.object_type || '').toLowerCase()
  const domain = resolveDomain({ kind, objectType })
  const contextText = asPlainText(row.context)

  return {
    id: row.id,
    recipientActorId: row.recipient_actor_id ?? null,
    actorId: row.actor_id ?? null,
    kind,
    objectType,
    objectId: row.object_id ?? null,
    linkPath: row.link_path ?? null,
    contextText,
    title: contextText || `${kind || 'update'} in ${domain}`,
    domain,
    priority: PRIORITY_BY_DOMAIN[domain] || 'medium',
    isRead: Boolean(row.is_read),
    isSeen: Boolean(row.is_seen),
    createdAt: row.created_at ?? null,
  }
}

export function modelProfessionalBriefingRows(rows = []) {
  return rows.map(modelProfessionalBriefingRow).filter(Boolean)
}

export function modelProfessionalBriefingsSummary(items = []) {
  const base = {
    total: 0,
    unseen: 0,
    unread: 0,
    byDomain: {
      operations: 0,
      compliance: 0,
      marketplace: 0,
      intelligence: 0,
    },
    byPriority: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
  }

  for (const item of items) {
    base.total += 1
    if (!item.isSeen) base.unseen += 1
    if (!item.isRead) base.unread += 1
    if (base.byDomain[item.domain] !== undefined) base.byDomain[item.domain] += 1
    if (base.byPriority[item.priority] !== undefined) base.byPriority[item.priority] += 1
  }

  return base
}
