import { ProfileSearchResultModel } from './profileSearchResult.model'
import { VportSearchResultModel } from './vportSearchResult.model'

export function DirectorySearchResultModel({ profiles, vports }) {
  return [
    ...profiles.map(ProfileSearchResultModel),
    ...vports.map(VportSearchResultModel),
  ]
}
