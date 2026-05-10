import {
  resolveVportLocksmithNameDAL,
  hasRecentLocksmithServiceAreaPostDAL,
} from "@/features/profiles/kinds/vport/dal/locksmith/vportLocksmithPost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { resolvePublicRealmIdDAL } from "@/features/feed/dal/resolvePublicRealm.dal";

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

export async function publishLocksmithServiceAreaUpdateAsPostController({ actorId, area }) {
  if (!actorId) throw new Error("publishLocksmithServiceAreaUpdateAsPost: actorId required");

  const realmId = resolvePublicRealmIdDAL();
  if (!realmId) return { published: false, reason: "missing_public_realm" };

  const alreadyPosted = await hasRecentLocksmithServiceAreaPostDAL({ actorId });
  if (alreadyPosted) return { published: false, reason: "throttled" };

  const locksmithName = await resolveVportLocksmithNameDAL(actorId);
  const text = buildPostText({ locksmithName, area });

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "locksmith_service_area_update",
    realm_id: realmId,
  });

  return { published: true, postId: created?.id ?? null };
}
