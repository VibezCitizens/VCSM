// src/features/wanders/core/controllers/wandersInboxescontroller.js
import { ensureGuestUser } from "@/features/wanders/core/controllers/_ensureGuestUser";
import {
  listWandersInboxesByOwnerUserDAL,
  readWandersInboxByIdDAL,
  readWandersInboxByPublicIdDAL,
} from "@/features/wanders/core/dal/read/inboxes.read.dal";
import {
  createWandersInboxDAL,
  updateWandersInboxDAL,
} from "@/features/wanders/core/dal/write/inboxes.write.dal";

function makePublicId(prefix = "w_inbox") {
  const id =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
  return `${prefix}_${id}`;
}

function toInbox(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    publicId: row.public_id ?? null,
    realmId: row.realm_id ?? null,
    ownerUserId: row.owner_user_id ?? null,
    ownerActorId: row.owner_actor_id ?? null,
    ownerAnonId: row.owner_anon_id ?? null,
    acceptsAnon: !!row.accepts_anon,
    defaultFolder: row.default_folder ?? "inbox",
    isActive: !!row.is_active,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export async function createAnonWandersInbox(input) {
  const user = await ensureGuestUser();

  const row = await createWandersInboxDAL({
    public_id: input?.publicId ?? makePublicId(),
    realm_id: input?.realmId,
    owner_user_id: user?.id,
    owner_actor_id: null,
    owner_anon_id: null,
    is_active: input?.isActive ?? true,
    accepts_anon: input?.acceptsAnon ?? true,
    default_folder: input?.defaultFolder ?? "inbox",
  });

  return toInbox(row);
}

export async function readWandersInboxById(input) {
  const row = await readWandersInboxByIdDAL({ inboxId: input?.inboxId });
  return toInbox(row);
}

export async function readWandersInboxByPublicId(input) {
  const row = await readWandersInboxByPublicIdDAL({
    publicId: input?.publicId,
  });
  return toInbox(row);
}

export async function listMyWandersInboxesAsAnon(input = {}) {
  const user = await ensureGuestUser();

  const rows = await listWandersInboxesByOwnerUserDAL({
    ownerUserId: user?.id,
    isActive: input?.isActive,
    limit: input?.limit ?? 50,
  });

  return rows.map(toInbox);
}

export async function updateMyWandersInbox(input) {
  const inboxId = input?.inboxId;
  if (!inboxId) throw new Error("updateMyWandersInbox requires { inboxId }");

  const patch = {};
  if (typeof input?.acceptsAnon === "boolean") patch.accepts_anon = input.acceptsAnon;
  if (typeof input?.defaultFolder === "string") patch.default_folder = input.defaultFolder;
  if (typeof input?.isActive === "boolean") patch.is_active = input.isActive;

  const row = await updateWandersInboxDAL({ inboxId, patch });
  return toInbox(row);
}

export const listWandersInboxesForViewer = listMyWandersInboxesAsAnon;
export const listMyInboxesAsGuest = listMyWandersInboxesAsAnon;
