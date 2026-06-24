import {
  resolveVportLocksmithNameDAL,
  hasRecentLocksmithServiceAreaPostDAL,
} from "@/features/profiles/kinds/vport/dal/locksmith/vportLocksmithPost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

// Drop C0 (0x00-0x1F), DEL (0x7F), and C1 (0x80-0x9F) control chars.
// Uses charCodeAt to avoid embedding literal control bytes in source.
function sanitizeText(str, maxLen) {
  if (!str || typeof str !== "string") return null;
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c >= 32 && c !== 127 && !(c >= 128 && c < 160)) out += str[i];
  }
  const trimmed = out.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLen) : null;
}

function buildPostText({ locksmithName, area }) {
  const name = locksmithName ?? "this locksmith";
  const lines = [`Service area updated at ${name}`];

  const locationParts = [];
  if (area?.label) {
    locationParts.push(area.label);
  } else {
    if (area?.city) locationParts.push(area.city);
    if (area?.stateCode) locationParts.push(area.stateCode);
  }

  if (locationParts.length) {
    lines.push("");
    lines.push(`Now serving: ${locationParts.join(", ")}`);
  }

  if (area?.isEmergencyCovered) {
    lines.push("Emergency service available");
  }

  return lines.join("\n");
}

export async function publishLocksmithServiceAreaUpdateAsPostController({
  identityActorId,
  actorId,
  area,
}) {
  if (!actorId) throw new Error("publishLocksmithServiceAreaUpdateAsPost: actorId required");
  if (!identityActorId) {
    throw new Error("publishLocksmithServiceAreaUpdateAsPost: identityActorId required");
  }

  // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): resolved from the auth
  // session via actor_owners — holds whether acting as the user or as the VPORT.
  await assertSessionOwnsActorController({ targetActorId: actorId });

  const realmId = PUBLIC_REALM_ID;
  if (!realmId) return { published: false, status: "skipped", reason: "missing_public_realm" };

  const alreadyPosted = await hasRecentLocksmithServiceAreaPostDAL({ actorId });
  if (alreadyPosted) return { published: false, status: "skipped", reason: "throttled" };

  const locksmithName = await resolveVportLocksmithNameDAL(actorId);

  const sanitizedArea = {
    label: sanitizeText(area?.label, 80),
    city: sanitizeText(area?.city, 64),
    stateCode: sanitizeText(area?.stateCode, 16),
    isEmergencyCovered: area?.isEmergencyCovered === true,
  };

  const text = buildPostText({ locksmithName, area: sanitizedArea });

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "locksmith_service_area_update",
    realm_id: realmId,
    payload: {
      label: sanitizedArea.label,
      city: sanitizedArea.city,
      stateCode: sanitizedArea.stateCode,
      isEmergencyCovered: sanitizedArea.isEmergencyCovered,
    },
  });

  return { published: true, status: "published", postId: created?.id ?? null };
}
