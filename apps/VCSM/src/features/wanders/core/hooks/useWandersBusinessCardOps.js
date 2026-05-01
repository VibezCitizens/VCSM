import { submitVportBusinessCardLeadController } from '@/features/public/vportBusinessCard/controller/vportBusinessCard.controller'
import { getBusinessCardSettings, deepMergeSettings } from '@/features/public/vportBusinessCard/model/businessCardSettings.model'

export function useWandersBusinessCardOps() {
  return {
    submitLead: submitVportBusinessCardLeadController,
    getBusinessCardSettings,
    deepMergeSettings,
  }
}
