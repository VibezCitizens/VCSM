/**
 * Owner-bind regression — personal suppression (post + comment) controllers
 *
 * TICKET-MODERATION-ACTORBIND-001 (V11-M2):
 * hidePostForActor / unhidePostForActor / hideCommentForActor / unhideCommentForActor
 * previously trusted the caller-supplied actorId when writing an actor_id-keyed
 * moderation.actions row (replay could pollute any victim's hidden set). They now
 * verify the authenticated session OWNS actorId via the canonical KIND-AGNOSTIC
 * session→vc.actor_owners owner-bind (readCurrentAuthUser +
 * readModerationActorOwnerLinkDAL) before any write. The acting actor may be a
 * user OR a vport. Rejection MUST occur before insertModerationActionDAL runs.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/moderation/dal/moderationActions.dal", () => ({
  insertModerationActionDAL: vi.fn(),
  listModerationActionsForActorOnObjectsDAL: vi.fn(),
}));
vi.mock("@/features/auth/adapters/authSession.adapter", () => ({
  readCurrentAuthUser: vi.fn(),
}));
vi.mock("@/features/moderation/dal/moderationActorOwnership.read.dal", () => ({
  readModerationActorOwnerLinkDAL: vi.fn(),
}));

import {
  hidePostForActor,
  unhidePostForActor,
} from "@/features/moderation/controllers/postVisibility.controller";
import {
  hideCommentForActor,
  unhideCommentForActor,
} from "@/features/moderation/controllers/commentVisibility.controller";
import { insertModerationActionDAL } from "@/features/moderation/dal/moderationActions.dal";
import { readCurrentAuthUser } from "@/features/auth/adapters/authSession.adapter";
import { readModerationActorOwnerLinkDAL } from "@/features/moderation/dal/moderationActorOwnership.read.dal";

const SESSION_UID = "auth-uid-1";
const USER_ACTOR = "user-actor-1";
const VPORT_ACTOR = "vport-actor-9";
const TARGET_POST = "post-7";
const TARGET_COMMENT = "comment-7";

beforeEach(() => {
  vi.clearAllMocks();
  readCurrentAuthUser.mockResolvedValue({ id: SESSION_UID });
  readModerationActorOwnerLinkDAL.mockResolvedValue({ actor_id: USER_ACTOR, is_void: false });
  insertModerationActionDAL.mockResolvedValue({ id: "action-1" });
});

// Each row: [label, controllerFn, args, targetField]
const HIDE_CASES = [
  ["hidePostForActor", hidePostForActor, { actorId: USER_ACTOR, postId: TARGET_POST }, "hide"],
  ["unhidePostForActor", unhidePostForActor, { actorId: USER_ACTOR, postId: TARGET_POST }, "unhide"],
  ["hideCommentForActor", hideCommentForActor, { actorId: USER_ACTOR, commentId: TARGET_COMMENT }, "hide"],
  ["unhideCommentForActor", unhideCommentForActor, { actorId: USER_ACTOR, commentId: TARGET_COMMENT }, "unhide"],
];

describe.each(HIDE_CASES)("%s — V11-M2 session owner-bind", (label, fn, args, actionType) => {
  it("owned USER actor → proceeds (moderation action written); helper queried with actor + session uid", async () => {
    const res = await fn(args);
    expect(readModerationActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: USER_ACTOR, userId: SESSION_UID });
    expect(insertModerationActionDAL).toHaveBeenCalledTimes(1);
    expect(insertModerationActionDAL).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: USER_ACTOR, actionType })
    );
    expect(res).toEqual({ ok: true });
  });

  it("owned VPORT actor → proceeds (kind-agnostic)", async () => {
    readModerationActorOwnerLinkDAL.mockResolvedValue({ actor_id: VPORT_ACTOR, is_void: false });
    const vportArgs = { ...args, actorId: VPORT_ACTOR };
    const res = await fn(vportArgs);
    expect(insertModerationActionDAL).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: VPORT_ACTOR, actionType })
    );
    expect(res).toEqual({ ok: true });
  });

  it("foreign/unowned actor → throws, moderation action NEVER written", async () => {
    readModerationActorOwnerLinkDAL.mockResolvedValue(null);
    await expect(fn(args)).rejects.toThrow(/does not own/i);
    expect(insertModerationActionDAL).not.toHaveBeenCalled();
  });

  it("no authenticated session → throws, moderation action NEVER written", async () => {
    readCurrentAuthUser.mockResolvedValue(null);
    await expect(fn(args)).rejects.toThrow(/does not own/i);
    expect(insertModerationActionDAL).not.toHaveBeenCalled();
  });
});
