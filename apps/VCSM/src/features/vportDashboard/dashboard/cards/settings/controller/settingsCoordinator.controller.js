import {
  normalizeAddress,
  hasAnyAddressValue,
  hasCompleteAddress,
  getAddressValidationError,
  normalizePhoneDigits,
  US_PHONE_DIGITS,
} from "@/features/vportDashboard/dashboard/cards/settings/model/vportSettingsValidation.model";
import { saveVportPublicDetailsByActorIdController } from "@/features/vportDashboard/dashboard/cards/settings/controller/saveVportPublicDetailsByActorId.controller";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

export async function settingsSaveCoordinator({
  actorId,
  callerActorId,
  draft,
  invalidateVportPublicDetails,
}) {
  const normalizedAddress = normalizeAddress(draft?.address);
  const addressStarted = hasAnyAddressValue(normalizedAddress);
  const addressComplete = hasCompleteAddress(normalizedAddress);
  const phoneDigits = normalizePhoneDigits(draft?.phonePublic);

  if (addressStarted && !addressComplete) {
    return { ok: false, error: "Please enter full address." };
  }
  if (addressStarted) {
    // Validate the RAW address, not the normalized one — normalization is lossy
    // (strips digits from city, truncates an over-long country code) and would
    // mask invalid input. normalizedAddress is still used for the saved payload.
    const addressError = getAddressValidationError(draft?.address);
    if (addressError) return { ok: false, error: addressError };
  }
  if (phoneDigits && phoneDigits.length !== US_PHONE_DIGITS) {
    return { ok: false, error: "Enter a valid 10-digit phone number." };
  }

  const payload = {
    ...draft,
    address: addressStarted ? normalizedAddress : {},
    phonePublic: phoneDigits,
  };

  try {
    const result = await saveVportPublicDetailsByActorIdController(actorId, payload, {
      requestActorId: callerActorId,
      invalidateVportPublicDetails,
    });
    return { ok: true, result };
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'settings.settingsCoordinator.controller', severity: 'error', message: `settingsSaveCoordinator: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'settingsSaveCoordinator', is_handled: true, context: { dbErrorCode: error?.code ?? null } })
    return { ok: false, error: error?.message ?? 'Save failed.' }
  }
}
