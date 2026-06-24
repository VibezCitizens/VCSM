import {
  resolveVportBarbershopNameDAL,
  hasRecentBarbershopHoursPostDAL,
} from "@/features/profiles/kinds/vport/dal/barbershop/vportBarbershopPost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function sanitizeBlocks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b) => {
      if (!b || typeof b !== "object") return false;
      const wd    = Number(b.weekday);
      const start = Number(b.startMinutes);
      const end   = Number(b.endMinutes);
      return (
        Number.isInteger(wd)    && wd >= 0    && wd <= 6   &&
        Number.isInteger(start) && start >= 0 && start < 1440 &&
        Number.isInteger(end)   && end > 0    && end <= 1440 &&
        end > start
      );
    })
    .map((b) => ({
      weekday:      Number(b.weekday),
      startMinutes: Number(b.startMinutes),
      endMinutes:   Number(b.endMinutes),
    }));
}

function fmtMinutes(m) {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}

function buildHoursText(barbershopName, blocks) {
  const name = barbershopName ?? "this barbershop";
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

export async function publishBarbershopHoursUpdateAsPostController({ actorId, blocks, callerActorId }) {
  if (!actorId) throw new Error("publishBarbershopHoursUpdateAsPost: actorId required");
  if (!callerActorId) throw new Error("publishBarbershopHoursUpdateAsPost: callerActorId required");

  // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): resolved from the auth
  // session via actor_owners — holds whether acting as the user or as the VPORT.
  await assertSessionOwnsActorController({ targetActorId: actorId });

  const realmId = PUBLIC_REALM_ID;
  if (!realmId) return { published: false, status: "skipped", reason: "missing_public_realm" };

  const alreadyPosted = await hasRecentBarbershopHoursPostDAL({ actorId });
  if (alreadyPosted) return { published: false, status: "skipped", reason: "throttled" };

  const barbershopName = await resolveVportBarbershopNameDAL(actorId);
  const sanitizedBlocks = sanitizeBlocks(blocks);
  const text = buildHoursText(barbershopName, sanitizedBlocks);

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "barbershop_hours_update",
    realm_id: realmId,
    media_url: null,
    payload: { blocks: sanitizedBlocks },
  });

  return { published: true, status: "published", postId: created?.id ?? null };
}
