// src/features/explore/search/usecases/search.usecase.js

import { searchDal } from '../dal/search.dal'
import { normalizeResult, dedupeByKindAndId } from '../model/search.model'

export async function searchUsecase(query, filter, opts = {}) {
  const calls = searchDal(query, filter, opts)

  const settled = await Promise.allSettled(calls)

  const rows = settled
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value || [])
    .map(normalizeResult)
    .filter(Boolean)

  return dedupeByKindAndId(rows)
}
