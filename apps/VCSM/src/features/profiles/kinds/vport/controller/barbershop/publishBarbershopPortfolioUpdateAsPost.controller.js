import {
  resolveVportBarbershopNameDAL,
  hasRecentBarbershopPortfolioPostDAL,
} from "@/features/profiles/kinds/vport/dal/barbershop/vportBarbershopPost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";

function buildPortfolioText(barbershopName, portfolioTitle) {
  const name = barbershopName ?? "this barbershop";
  const header = `New portfolio work added by ${name}`;
  if (!portfolioTitle || !String(portfolioTitle).trim()) return header;
  return `${header}\n\n${String(portfolioTitle).trim()}`;
}

export async function publishBarbershopPortfolioUpdateAsPostController({
  actorId,
  portfolioTitle,
  mediaUrl,
}) {
  if (!actorId) throw new Error("publishBarbershopPortfolioUpdateAsPost: actorId required");

  const realmId = PUBLIC_REALM_ID;
  if (!realmId) return { published: false, reason: "missing_public_realm" };

  const alreadyPosted = await hasRecentBarbershopPortfolioPostDAL({ actorId });
  if (alreadyPosted) return { published: false, reason: "throttled" };

  const barbershopName = await resolveVportBarbershopNameDAL(actorId);
  const text = buildPortfolioText(barbershopName, portfolioTitle ?? null);

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "barbershop_portfolio_update",
    realm_id: realmId,
    media_url: mediaUrl ?? null,
  });

  return { published: true, postId: created?.id ?? null };
}
