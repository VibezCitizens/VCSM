import useInbox from './useInbox.js'

export default function useInboxFolder({ actorId, folder = 'inbox' }) {
  const includeArchived = folder === 'archived'
  return useInbox({ actorId, folder, includeArchived })
}
