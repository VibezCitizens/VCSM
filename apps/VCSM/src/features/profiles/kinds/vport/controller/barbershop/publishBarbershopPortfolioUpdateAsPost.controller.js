import {
  resolveVportBarbershopNameDAL,
  hasRecentBarbershopPortfolioPostDAL,
} from "@/features/profiles/kinds/vport/dal/barbershop/vportBarbershopPost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

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
  callerActorId,
  vportKind,
}) {
  if (!actorId) throw new Error("publishBarbershopPortfolioUpdateAsPost: actorId required");
  if (!callerActorId) throw new Error("publishBarbershopPortfolioUpdateAsPost: callerActorId required");

  // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): resolved from the auth
  // session via actor_owners — holds whether acting as the user or as the VPORT.
  await assertSessionOwnsActorController({ targetActorId: actorId });

  const realmId = PUBLIC_REALM_ID;
  if (!realmId) return { published: false, status: "skipped", reason: "missing_public_realm" };

  const alreadyPosted = await hasRecentBarbershopPortfolioPostDAL({ actorId });
  if (alreadyPosted) return { published: false, status: "skipped", reason: "throttled" };

  const barbershopName = await resolveVportBarbershopNameDAL(actorId);
  const sanitizedTitle = sanitizeText(portfolioTitle ?? null, 120);
  const text = buildPortfolioText(barbershopName, sanitizedTitle);

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "barbershop_portfolio_update",
    realm_id: realmId,
    media_url: mediaUrl ?? null,
    payload: { portfolioTitle: sanitizedTitle, vportKind: vportKind ?? null },
  });

  return { published: true, status: "published", postId: created?.id ?? null };
}
