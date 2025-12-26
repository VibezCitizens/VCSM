// src/features/explore/search/dal/search.dal.js

import { search } from './search.data'   // ✅ correct path

// ============================================================
// Search DAL (ACTOR-FIRST)
// ------------------------------------------------------------
// Rules:
// - DAL only orchestrates data sources
// - DAL NEVER decides identity semantics
// - Actor identity MUST come from data layer
// ============================================================

export function searchDal(query, filter, opts = {}) {
  switch (filter) {
    case 'users':
      return [
        search.users(query, opts), // MUST return result_type: 'actor'
      ]

    case 'vports':
      return [
        search.vports(query, opts),
      ]

    case 'posts':
      return [
        search.posts(query, opts),
      ]

    case 'videos':
      return [
        search.videos(query, opts),
      ]

    case 'groups':
      return [
        search.groups(query, opts),
      ]

    case 'all':
    default:
      return [
        search.users(query, opts),
        search.vports(query, opts),
        search.posts(query, opts),
        search.videos(query, opts),
        search.groups(query, opts),
      ]
  }
}