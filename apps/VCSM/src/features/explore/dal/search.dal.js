// src/features/explore/dal/search.dal.js

import { search } from './search.data'

// ============================================================
// Search DAL — routes queries by filter tab
// Passes viewerActorId for server-side block filtering
// ============================================================

export function searchDal(query, filter, opts = {}) {
  switch (filter) {
    case 'users':
      return [search.users(query, opts)]

    case 'vports':
      return [search.vports(query, opts)]

    case 'posts':
      return [search.posts(query, opts)]

    case 'videos':
      return [search.videos(query, opts)]

    case 'groups':
      return [search.groups(query, opts)]

    case 'all':
    default:
      // Single RPC call with filter='all' returns both users + vports
      return [
        search.actors(query, opts),
        search.posts(query, opts),
        search.videos(query, opts),
        search.groups(query, opts),
      ]
  }
}
