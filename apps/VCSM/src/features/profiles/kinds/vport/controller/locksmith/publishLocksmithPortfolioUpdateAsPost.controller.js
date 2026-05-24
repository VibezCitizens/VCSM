import {
  resolveVportLocksmithNameDAL,
  hasRecentLocksmithPortfolioPostDAL,
} from "@/features/profiles/kinds/vport/dal/locksmith/vportLocksmithPost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";

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
  const detail = portfolioTitle?.trim() || (jobType ? (JOB_TYPE_LABELS[jobType] ?? jobType) : null);
  if (!detail) return header;
  return `${header}\n\n${detail}`;
}

export async function publishLocksmithPortfolioUpdateAsPostController({
  actorId,
  portfolioTitle,
  jobType,
  mediaUrl,
}) {
  if (!actorId) throw new Error("publishLocksmithPortfolioUpdateAsPost: actorId required");

  const realmId = PUBLIC_REALM_ID;
  if (!realmId) return { published: false, reason: "missing_public_realm" };

  const alreadyPosted = await hasRecentLocksmithPortfolioPostDAL({ actorId });
  if (alreadyPosted) return { published: false, reason: "throttled" };

  const locksmithName = await resolveVportLocksmithNameDAL(actorId);
  const text = buildPortfolioText(locksmithName, portfolioTitle ?? null, jobType ?? null);

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "locksmith_portfolio_update",
    realm_id: realmId,
    media_url: mediaUrl ?? null,
  });

  return { published: true, postId: created?.id ?? null };
}
