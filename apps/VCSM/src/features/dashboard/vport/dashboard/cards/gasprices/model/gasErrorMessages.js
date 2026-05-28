export const GAS_ERROR_MESSAGES = {
  not_owner: "You don't have permission to update this station.",
  out_of_range: "Price is outside the allowed range.",
  too_far_from_official: "Price differs too much from the current official price.",
  profile_not_found: "This station isn't set up yet.",
  invalid_fuel_key: "Fuel type is not recognized.",
  already_pending: "You already have a pending suggestion for this fuel type.",
  invalid_number: "Please enter a valid price.",
  not_pending: "This suggestion has already been reviewed.",
  invalid_decision: "Invalid review decision.",
  invalid_fuel_key_in_submission: "This submission contains an unrecognized fuel type.",
};

const FALLBACK = "Something went wrong. Please try again.";

export function normalizeGasError(err) {
  if (err == null) return null;
  const reason = err?.reason ?? (typeof err === "string" ? err : err?.message ?? null);
  return GAS_ERROR_MESSAGES[reason] ?? FALLBACK;
}
