import { searchDal } from '@/features/explore/dal/search.dal'

export async function ctrlSearchTabs({
  query,
  filter = 'all',
  limit = 25,
  offset = 0,
}) {
  const calls = searchDal(query, filter, { limit, offset })
  const responses = await Promise.all(calls)
  return responses.flat()
}
