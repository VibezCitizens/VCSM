import { getInboxEntries } from '@/features/chat/inbox/dal/inbox.read.dal'

export async function ctrlGetInboxEntries({
  actorId,
  includeArchived = false,
  folder = 'inbox',
}) {
  return getInboxEntries({
    actorId,
    includeArchived,
    folder,
  })
}
