import { invalidateActorProfileCache } from '@/features/profiles/controller/profileCache.controller'
import { invalidateVportPublicDetails } from '@/features/profiles/kinds/vport/controller/getVportPublicDetails.controller'
import { getVportTabsByType } from '@/features/profiles/kinds/vport/model/getVportTabsByType.model'
import { getFallbackServiceCatalogRows } from '@/features/profiles/kinds/vport/model/services/vportServiceCatalogFallback.model'

export function useProfilesOps() {
  return {
    invalidateActorProfileCache,
    invalidateVportPublicDetails,
    getVportTabsByType,
    getFallbackServiceCatalogRows,
  }
}
