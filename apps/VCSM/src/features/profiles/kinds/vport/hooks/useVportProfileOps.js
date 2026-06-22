// VPORT profile operations — public-details cache invalidation, tab resolution, service catalog fallback
import { invalidateVportPublicDetails } from '@/features/profiles/kinds/vport/controller/getVportPublicDetails.controller'
import { getVportTabsByType } from '@/features/profiles/kinds/vport/model/getVportTabsByType.model'
import { getFallbackServiceCatalogRows } from '@/features/profiles/kinds/vport/model/services/vportServiceCatalogFallback.model'

export function useVportProfileOps() {
  return {
    invalidateVportPublicDetails,
    getVportTabsByType,
    getFallbackServiceCatalogRows,
  }
}
