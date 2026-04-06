import { searchDal } from '@/features/explore/dal/search.dal'

export async function ctrlSearchTabs({
  query,
  filter = 'all',
  limit = 25,
  offset = 0,
  viewerActorId = null,
}) {
  const calls = searchDal(query, filter, { limit, offset, viewerActorId })
  const responses = await Promise.all(calls)
  return responses.flat()
}
