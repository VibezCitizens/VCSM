import readVportBusinessCardPublicBySlugDAL from "@/features/public/vportBusinessCard/dal/vportBusinessCard.read.dal";
import createVportBusinessCardLeadDAL from "@/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal";
import {
  mapVportBusinessCardPublicRow,
  validateVportBusinessCardLeadInput,
} from "@/features/public/vportBusinessCard/model/vportBusinessCard.model";
import { sendLeadConfirmationEmailDAL } from "@/features/public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";
import { readBusinessCardSectionsDAL } from "@/features/public/vportBusinessCard/dal/businessCardSections.read.dal";

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

function fireLeadOwnerNotification({ result, leadName, source }) {
  const recipientActorId = result?.actor_id ?? null;
  const leadId = result?.lead_id ?? null;
  if (!recipientActorId) return;

  publishVcsmNotification({
    recipientActorId,
    actorId: null,
    kind: "lead_received",
    objectType: "lead",
    objectId: leadId ? String(leadId) : null,
    linkPath: `/actor/${recipientActorId}/dashboard/leads`,
    context: {
      leadName: leadName ?? null,
      source: source ?? "business_card",
    },
  });
}

function fireLeadConfirmationEmail({ email, name, vportName, providerProfileUrl, source }) {
  sendLeadConfirmationEmailDAL({ email, name, vportName, providerProfileUrl, source });
}

export async function submitVportBusinessCardLeadController({
  slug,
  name,
  phone,
  email,
  message,
  source = "business_card",
  userAgent = null,
  vportName = null,
  providerProfileUrl = null,
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

    fireLeadConfirmationEmail({
      email: validation.payload.email,
      name: validation.payload.name,
      vportName,
      providerProfileUrl,
      source,
    });

    fireLeadOwnerNotification({
      result,
      leadName: validation.payload.name,
      source,
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

export async function getVportBusinessCardSectionsController({ profileId } = {}) {
  if (!profileId) return null;
  return readBusinessCardSectionsDAL(profileId);
}
