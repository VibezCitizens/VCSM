import {
  resolveVportLocksmithNameDAL,
  hasRecentLocksmithPortfolioPostDAL,
} from "@/features/profiles/kinds/vport/dal/locksmith/vportLocksmithPost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";
import { assertSessionOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

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

const JOB_TYPE_LABELS = {
  lockout: "Lockout",
  rekey: "Rekeying",
  lock_change: "Lock Change",
  new_install: "New Install",
  repair: "Repair",
  smart_lock: "Smart Lock",
  safe: "Safe",
  car_key: "Car Key Replacement",
  commercial_hardware: "Commercial Hardware",
  security_upgrade: "Security Upgrade",
};

function buildPortfolioText(locksmithName, portfolioTitle, jobType) {
  const name = locksmithName ?? "this locksmith";
  const header = `New locksmith work added by ${name}`;
  // jobType is already allowlist-validated before this call — no raw fallback.
  const detail = portfolioTitle?.trim() || (jobType ? JOB_TYPE_LABELS[jobType] : null);
  if (!detail) return header;
  return `${header}\n\n${detail}`;
}

export async function publishLocksmithPortfolioUpdateAsPostController({
  identityActorId,
  actorId,
  portfolioTitle,
  jobType,
  mediaUrl,
}) {
  if (!actorId) throw new Error("publishLocksmithPortfolioUpdateAsPost: actorId required");
  if (!identityActorId) {
    throw new Error("publishLocksmithPortfolioUpdateAsPost: identityActorId required");
  }

  // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): resolved from the auth
  // session via actor_owners — holds whether acting as the user or as the VPORT.
  await assertSessionOwnsVportActorController({ targetActorId: actorId });

  const realmId = PUBLIC_REALM_ID;
  if (!realmId) return { published: false, status: "skipped", reason: "missing_public_realm" };

  const alreadyPosted = await hasRecentLocksmithPortfolioPostDAL({ actorId });
  if (alreadyPosted) return { published: false, status: "skipped", reason: "throttled" };

  const locksmithName = await resolveVportLocksmithNameDAL(actorId);

  // Allowlist: reject unknown jobType values so they never reach post text or payload.
  const validJobType = JOB_TYPE_LABELS[jobType] !== undefined ? jobType : null;
  const sanitizedTitle = sanitizeText(portfolioTitle, 120);
  const text = buildPortfolioText(locksmithName, sanitizedTitle, validJobType);

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "locksmith_portfolio_update",
    realm_id: realmId,
    media_url: mediaUrl ?? null,
    payload: {
      portfolioTitle: sanitizedTitle,
      jobType: validJobType,
    },
  });

  return { published: true, status: "published", postId: created?.id ?? null };
}
