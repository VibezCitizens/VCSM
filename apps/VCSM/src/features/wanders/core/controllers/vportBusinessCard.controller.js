import readVportBusinessCardPublicBySlugDAL from "@/features/wanders/core/dal/read/vportBusinessCard.read.dal";
import createVportBusinessCardLeadDAL from "@/features/wanders/core/dal/write/vportBusinessCardLead.write.dal";
import {
  mapVportBusinessCardPublicRow,
  validateVportBusinessCardLeadInput,
} from "@/features/wanders/core/models/vportBusinessCard.model";

export async function getVportBusinessCardPublicController({ slug } = {}) {
  const key = String(slug || "").trim().toLowerCase();
  if (!key) return null;

  const row = await readVportBusinessCardPublicBySlugDAL({ slug: key });
  if (!row) return null;

  return mapVportBusinessCardPublicRow(row);
}

function toLeadError(message, fieldErrors = null) {
  const err = new Error(message);
  if (fieldErrors) err.fieldErrors = fieldErrors;
  return err;
}

export async function submitVportBusinessCardLeadController({
  slug,
  name,
  phone,
  email,
  message,
  source = "business_card",
  userAgent = null,
} = {}) {
  const slugKey = String(slug || "").trim().toLowerCase();
  if (!slugKey) throw toLeadError("Card unavailable.");

  const validation = validateVportBusinessCardLeadInput({
    name,
    phone,
    email,
    message,
  });

  if (!validation.ok) {
    throw toLeadError("Please fix the highlighted fields.", validation.fieldErrors);
  }

  try {
    const result = await createVportBusinessCardLeadDAL({
      slug: slugKey,
      name: validation.payload.name,
      phone: validation.payload.phone,
      email: validation.payload.email,
      message: validation.payload.message,
      source,
      userAgent,
    });

    return {
      ok: true,
      result,
    };
  } catch (error) {
    const raw = String(error?.message || error || "");

    if (raw.includes("CARD_UNAVAILABLE")) {
      throw toLeadError("This business card is unavailable.");
    }

    if (raw.includes("INVALID_INPUT")) {
      throw toLeadError("Please fill out all required fields.");
    }

    throw toLeadError("Failed to send message. Please try again.");
  }
}
