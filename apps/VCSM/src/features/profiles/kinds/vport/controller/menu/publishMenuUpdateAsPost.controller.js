import {
  resolveVportRestaurantNameDAL,
} from "@/features/profiles/kinds/vport/dal/menu/vportMenuPost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { resolvePublicRealmIdDAL } from "@/features/feed/dal/resolvePublicRealm.dal";

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
  actorId,
  action,
  subject,
  subjectName,
  categoryName = null,
  imageUrl = null,
}) {
  if (!actorId) throw new Error("publishMenuUpdateAsPost: actorId required");
  if (!subjectName) return { published: false, reason: "no_subject_name" };

  const realmId = await resolvePublicRealmIdDAL();
  if (!realmId) return { published: false, reason: "missing_public_realm" };

  const restaurantName = await resolveVportRestaurantNameDAL(actorId);
  const text = buildPostText({ restaurantName, action, subject, subjectName, categoryName });

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "menu_update",
    realm_id: realmId,
    media_url: imageUrl || null,
  });

  return { published: true, postId: created?.id ?? null };
}
