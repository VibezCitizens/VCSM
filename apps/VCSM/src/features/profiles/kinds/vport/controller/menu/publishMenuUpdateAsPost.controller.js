import {
  resolveVportRestaurantNameDAL,
  hasRecentMenuUpdatePostDAL,
} from "@/features/profiles/kinds/vport/dal/menu/vportMenuPost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";
import { assertSessionOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

function buildPostText({ restaurantName, action, subject, subjectName, categoryName }) {
  const name = restaurantName ?? "this restaurant";
  const actionLabel = action === "added" ? "Added" : "Updated";
  const subjectLabel = subject === "category" ? "category" : "item";
  const detail =
    subject === "item" && categoryName
      ? `${subjectName} (${categoryName})`
      : subjectName;
  return `Menu updated at ${name}\n\n${actionLabel} ${subjectLabel}: ${detail}`;
}

export async function publishMenuUpdateAsPostController({
  identityActorId,
  actorId,
  action,
  subject,
  subjectName,
  categoryName = null,
  imageUrl = null,
}) {
  if (!actorId) throw new Error("publishMenuUpdateAsPost: actorId required");
  if (!identityActorId) throw new Error("publishMenuUpdateAsPost: identityActorId required");
  if (!subjectName) return { published: false, status: "skipped", reason: "no_subject_name" };

  // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): resolved from the auth
  // session via actor_owners — holds whether acting as the user or as the VPORT.
  await assertSessionOwnsVportActorController({ targetActorId: actorId });

  const realmId = PUBLIC_REALM_ID;
  if (!realmId) return { published: false, status: "skipped", reason: "missing_public_realm" };

  const alreadyPosted = await hasRecentMenuUpdatePostDAL({ actorId });
  if (alreadyPosted) return { published: false, status: "skipped", reason: "throttled" };

  const restaurantName = await resolveVportRestaurantNameDAL(actorId);
  const text = buildPostText({ restaurantName, action, subject, subjectName, categoryName });

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "menu_update",
    realm_id: realmId,
    media_url: imageUrl || null,
    payload: {
      action,
      subject,
      subjectName,
      categoryName: categoryName ?? null,
      imageUrl: imageUrl ?? null,
    },
  });

  return { published: true, status: "published", postId: created?.id ?? null };
}
