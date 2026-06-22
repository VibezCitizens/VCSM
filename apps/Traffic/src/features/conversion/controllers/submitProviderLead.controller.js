import {
  invokeProviderLeadConfirmation,
  invokeProviderLeadNotification,
  readProviderLeadSessionUser,
  submitProviderLeadRow
} from "@/features/conversion/dal/submitProviderLead.write.dal";
import {
  isCardUnavailableError,
  mapProviderLeadUserToPrefill,
  normalizeProviderLeadDraft,
  validateProviderLeadDraft
} from "@/features/conversion/models/providerLead.model";

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
    const result = await submitProviderLeadRow({
      config: input.config,
      lead
    });

    void invokeProviderLeadConfirmation({
      config: input.config,
      lead
    });

    // Notify the owning VPORT actor via the server-side bridge (Edge Function).
    // The lead row carries the recipient; we pass only the lead id. The lead is
    // already committed above, so awaiting this does not block lead creation —
    // it lets us surface a structured diagnostic (never thrown) to the dev UI.
    const notification = await invokeProviderLeadNotification({
      config: input.config,
      leadId: result?.lead_id ?? null
    });

    return {
      ok: true,
      status: "success",
      fieldErrors: {},
      notification
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
