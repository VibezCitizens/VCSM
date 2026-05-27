import { toText } from "@/shared/lib/text";

/**
 * Normalizes a raw `business_card_leads` database row into a domain lead object.
 * This is the canonical shape used by all controllers, hooks, and screens.
 *
 * @param {object} row — raw row from vport.business_card_leads
 * @returns {object} normalized lead
 */
export function normalizeVportLead(row) {
  const source = toText(row?.source).toLowerCase();
  return {
    id: row?.id ?? null,
    profileId: row?.vport_profile_id ?? null,
    actorId: row?.actor_id ?? null,
    name: toText(row?.name) || "Lead",
    phone: toText(row?.phone) || "",
    email: toText(row?.email) || "",
    message: toText(row?.message) || "",
    source,
    createdAt: row?.created_at ?? null,
    isContacted: source.includes("contacted"),
  };
}
