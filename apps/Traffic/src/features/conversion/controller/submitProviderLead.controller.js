import {
  invokeProviderLeadConfirmation,
  readProviderLeadSessionUser,
  submitProviderLeadRow
} from "@/features/conversion/dal/submitProviderLead.write.dal";
import {
  isCardUnavailableError,
  mapProviderLeadUserToPrefill,
  normalizeProviderLeadDraft,
  validateProviderLeadDraft
} from "@/features/conversion/model/providerLead.model";

export async function getProviderLeadPrefill(config = {}) {
  const user = await readProviderLeadSessionUser(config);
  if (!user) {
    return {
      actorId: null,
      name: "",
      email: ""
    };
  }

  return mapProviderLeadUserToPrefill(user);
}

export async function submitProviderLead(input = {}) {
  const lead = normalizeProviderLeadDraft(input);
  const validation = validateProviderLeadDraft(lead);

  if (!validation.ok) {
    return {
      ok: false,
      status: "validation_error",
      fieldErrors: validation.fieldErrors
    };
  }

  try {
    await submitProviderLeadRow({
      config: input.config,
      lead
    });

    void invokeProviderLeadConfirmation({
      config: input.config,
      lead
    });

    return {
      ok: true,
      status: "success",
      fieldErrors: {}
    };
  } catch (error) {
    if (isCardUnavailableError(error)) {
      return {
        ok: false,
        status: "unavailable",
        fieldErrors: {}
      };
    }

    throw error;
  }
}
