import readVportBusinessCardPublicBySlugDAL from "@/features/public/vportBusinessCard/dal/vportBusinessCard.read.dal";
import createVportBusinessCardLeadDAL from "@/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal";
import {
  mapVportBusinessCardPublicRow,
  validateVportBusinessCardLeadInput,
} from "@/features/public/vportBusinessCard/model/vportBusinessCard.model";
import { sendLeadConfirmationEmailDAL } from "@/features/public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal";
import { publishLeadNotificationDAL } from "@/features/public/vportBusinessCard/dal/publishLeadNotification.edge.dal";
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

function fireLeadOwnerNotification({ result }) {
  // Anonymous business-card visitors have no session, so the session-guarded
  // app publisher cannot fire here. Route through the server-side bridge, which
  // derives the recipient and safe payload from the lead row (forgery-resistant)
  // and uses the same notification engine RPCs as every other VCSM notification.
  const leadId = result?.lead_id ?? null;
  if (!leadId) {
    return { ok: false, fn: "publish-lead-notification", leadId: null, error: "MISSING_LEAD_ID" };
  }

  return publishLeadNotificationDAL({ leadId });
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

    // Lead row is already committed above, so awaiting this does not block lead
    // creation — it lets us surface a structured diagnostic (never thrown).
    const notification = await fireLeadOwnerNotification({ result });

    return {
      ok: true,
      result,
      notification,
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

export async function getVportBusinessCardSectionsController({ slug } = {}) {
  const key = String(slug || "").trim().toLowerCase();
  if (!key) return null;
  // Derive profileId server-side from slug — never accept from public caller (PUBLIC-002).
  const row = await readVportBusinessCardPublicBySlugDAL({ slug: key });
  if (!row || !row.profile_id) return null;
  return readBusinessCardSectionsDAL(row.profile_id);
}
