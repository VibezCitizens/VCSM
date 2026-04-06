import { searchActorsDAL } from '../dal/searchActors.dal.js'
import { DirectorySearchResultModel } from '../model/DirectorySearchResult.model.js'

/**
 * Controller: searchDirectory
 * --------------------------------
 * Actor-safe search entrypoint.
 * Returns domain-safe actor search results.
 */
export async function searchDirectoryController(query, opts = {}) {
  const { limitPerKind = 8 } = opts

  const actors = await searchActorsDAL(query, limitPerKind)
  return DirectorySearchResultModel(actors)
}
