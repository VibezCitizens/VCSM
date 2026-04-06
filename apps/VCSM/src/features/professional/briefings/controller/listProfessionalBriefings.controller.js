import {
  dalListProfessionalBriefings,
  dalMarkProfessionalBriefingsSeen,
} from '@/features/professional/briefings/dal/professionalBriefings.read.dal'
import {
  modelProfessionalBriefingRows,
  modelProfessionalBriefingsSummary,
} from '@/features/professional/briefings/model/professionalBriefing.model'

function matchesDomain(item, domain) {
  if (!domain || domain === 'all') return true
  return item.domain === domain
}

function matchesQuery(item, query) {
  if (!query) return true
  const q = query.toLowerCase()
  return [item.title, item.contextText, item.kind, item.objectType, item.domain]
    .join(' ')
    .toLowerCase()
    .includes(q)
}

function matchesUnread(item, unreadOnly) {
  if (!unreadOnly) return true
  return !item.isRead || !item.isSeen
}

export async function ctrlListProfessionalBriefings({
  actorId,
  beforeCreatedAt = null,
  limit = 40,
  domain = 'all',
  query = '',
  unreadOnly = false,
}) {
  if (!actorId) {
    throw new Error('[professional/briefings] actorId required')
  }

  const raw = await dalListProfessionalBriefings({
    recipientActorId: actorId,
    beforeCreatedAt,
    limit,
  })

  const modeled = modelProfessionalBriefingRows(raw)
  const filtered = modeled.filter(
    (item) => matchesDomain(item, domain) && matchesQuery(item, query) && matchesUnread(item, unreadOnly)
  )

  return {
    items: filtered,
    summary: modelProfessionalBriefingsSummary(filtered),
    cursor: filtered.at(-1)?.createdAt ?? null,
  }
}

export async function ctrlMarkProfessionalBriefingsSeen({
  actorId,
  notificationIds = [],
}) {
  if (!actorId || notificationIds.length === 0) return

  await dalMarkProfessionalBriefingsSeen({
    recipientActorId: actorId,
    notificationIds,
  })
}
