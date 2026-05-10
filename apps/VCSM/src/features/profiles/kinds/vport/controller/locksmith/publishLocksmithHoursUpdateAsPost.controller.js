import {
  resolveVportLocksmithNameDAL,
  hasRecentLocksmithHoursPostDAL,
} from "@/features/profiles/kinds/vport/dal/locksmith/vportLocksmithPost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { resolvePublicRealmIdDAL } from "@/features/feed/dal/resolvePublicRealm.dal";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtMinutes(m) {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}

function buildHoursText(locksmithName, blocks) {
  const name = locksmithName ?? "this locksmith";
  const header = `Booking hours updated at ${name}`;
  if (!blocks || !blocks.length) return header;

  const byDay = {};
  for (const b of blocks) {
    const wd = b.weekday;
    if (!byDay[wd]) byDay[wd] = [];
    byDay[wd].push(b);
  }

  const lines = [];
  for (let wd = 0; wd < 7; wd++) {
    const dayBlocks = byDay[wd];
    if (!dayBlocks || !dayBlocks.length) continue;
    const ranges = dayBlocks
      .sort((a, b) => a.startMinutes - b.startMinutes)
      .map((b) => `${fmtMinutes(b.startMinutes)} – ${fmtMinutes(b.endMinutes)}`)
      .join(", ");
    lines.push(`${DAY_ABBR[wd]}: ${ranges}`);
  }

  if (!lines.length) return header;
  return `${header}\n\n${lines.join("\n")}`;
}

export async function publishLocksmithHoursUpdateAsPostController({ actorId, blocks }) {
  if (!actorId) throw new Error("publishLocksmithHoursUpdateAsPost: actorId required");

  const realmId = resolvePublicRealmIdDAL();
  if (!realmId) return { published: false, reason: "missing_public_realm" };

  const alreadyPosted = await hasRecentLocksmithHoursPostDAL({ actorId });
  if (alreadyPosted) return { published: false, reason: "throttled" };

  const locksmithName = await resolveVportLocksmithNameDAL(actorId);
  const text = buildHoursText(locksmithName, blocks);

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "locksmith_hours_update",
    realm_id: realmId,
    media_url: null,
  });

  return { published: true, postId: created?.id ?? null };
}
