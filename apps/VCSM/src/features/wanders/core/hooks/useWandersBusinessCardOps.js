import { submitVportBusinessCardLead } from '@/features/public/adapters/public.adapter'
import { getBusinessCardSettings, deepMergeSettings } from '@/shared/lib/businessCard/businessCardSettings.model'

export function useWandersBusinessCardOps() {
  return {
    submitLead: submitVportBusinessCardLead,
    getBusinessCardSettings,
    deepMergeSettings,
  }
}
