import { nanoid } from "nanoid";
import { ensureWandersAnonIdentity } from "@/features/wanders/controllers/ensureWandersAnoncontroller";
import { getOrCreateWandersInboxForAnon } from "@/features/wanders/controllers/wandersInbox.controller"; 
// If you don't have this, see note below.

import {
  createDropLink,
  deactivateDropLink,
  getActiveDropLinkByOwnerAnonId,
} from "@/features/wanders/dal/wandersDropLinks.dal";

function safeTrim(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

/**
 * Owner: get or create an active drop link.
 * Returns { publicId, url }
 */
export async function getOrCreateInboxDropLink({ baseUrl, title = null } = {}) {
  const anon = await ensureWandersAnonIdentity({ touch: true });

  // You already have wanders.inboxes table: ensure owner has one.
  // Must return { id, realm_id, owner_anon_id, public_id, ... }
  const inbox = await getOrCreateWandersInboxForAnon({ ownerAnonId: anon.id });

  const existing = await getActiveDropLinkByOwnerAnonId(anon.id);
  const publicId = existing?.public_id ? safeTrim(existing.public_id) : nanoid(18);

  if (!existing) {
    await createDropLink({
      inboxId: inbox.id,
      ownerAnonId: anon.id,
      publicId,
      title,
      expiresAt: null,
    });
  }

  const origin =
    baseUrl ||
    (typeof window !== "undefined" && window.location?.origin ? window.location.origin : "");

  const url = origin ? `${origin}/wanders/drop/${publicId}` : `/wanders/drop/${publicId}`;

  return { publicId, url };
}

export async function rotateInboxDropLink({ baseUrl, title = null } = {}) {
  const anon = await ensureWandersAnonIdentity({ touch: true });

  const existing = await getActiveDropLinkByOwnerAnonId(anon.id);
  if (existing?.id) {
    await deactivateDropLink(existing.id);
  }
  return getOrCreateInboxDropLink({ baseUrl, title });
}
