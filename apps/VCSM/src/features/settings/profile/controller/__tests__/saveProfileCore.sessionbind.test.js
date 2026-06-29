/**
 * Account-level session bind — saveProfileCore (user-profile text write)
 *
 * TICKET-SETTINGS-USERPROFILE-SESSIONBIND-001 (V12A-M1):
 * The user-branch profile write previously trusted a caller-supplied `subjectId`
 * (= public.profiles.id = auth.users.id) with no app-layer session re-bind. The
 * controller now asserts `subjectId === readCurrentAuthUser().id` for mode 'user'
 * BEFORE any side effect (upload/payload/write). The vport path is bound by the DAL
 * `owner_user_id` filter and intentionally bypasses this gate.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/settings/profile/dal/profile.read.dal", () => ({
  fetchProfile: vi.fn(),
}));
vi.mock("@/features/settings/profile/dal/profile.write.dal", () => ({
  updateProfile: vi.fn(),
}));
vi.mock("@/features/settings/profile/model/profile.model", () => ({
  mapProfileToView: vi.fn(),
  mapProfileUpdate: vi.fn((ui) => ({ display_name: ui.displayName ?? null })),
}));
vi.mock("@/features/settings/profile/dal/actorIdBySubject.read.dal", () => ({
  dalReadActorIdByProfileId: vi.fn(),
  dalReadActorIdByVportId: vi.fn(),
}));
vi.mock("@/features/auth/adapters/authSession.adapter", () => ({
  readCurrentAuthUser: vi.fn(),
}));
vi.mock("@hydration", () => ({
  useActorStore: { getState: () => ({ upsertActors: vi.fn() }) },
}));

import { saveProfileCore } from "@/features/settings/profile/controller/profile.controller";
import { updateProfile } from "@/features/settings/profile/dal/profile.write.dal";
import { readCurrentAuthUser } from "@/features/auth/adapters/authSession.adapter";
import { dalReadActorIdByProfileId, dalReadActorIdByVportId } from "@/features/settings/profile/dal/actorIdBySubject.read.dal";

const USER_ID = "user-uuid-1";
const VICTIM_ID = "victim-uuid-2";
const VPORT_ID = "vport-uuid-3";

let uploads;

beforeEach(() => {
  vi.clearAllMocks();
  readCurrentAuthUser.mockResolvedValue({ id: USER_ID });
  updateProfile.mockResolvedValue({ id: USER_ID, photo_url: "p", banner_url: "b" });
  dalReadActorIdByProfileId.mockResolvedValue("actor-1");
  dalReadActorIdByVportId.mockResolvedValue("actor-1");
  uploads = { uploadAvatar: vi.fn(), uploadBanner: vi.fn() };
});

describe("saveProfileCore — V12A-M1 account-level session bind", () => {
  it("matching session id → proceeds (updateProfile called)", async () => {
    await saveProfileCore({ subjectId: USER_ID, mode: "user", draft: {}, uploads });
    expect(updateProfile).toHaveBeenCalledOnce();
    expect(updateProfile).toHaveBeenCalledWith(USER_ID, "user", expect.any(Object));
  });

  it("forged subjectId (session mismatch) → throws", async () => {
    await expect(
      saveProfileCore({ subjectId: VICTIM_ID, mode: "user", draft: {}, uploads })
    ).rejects.toThrow(/authenticated session/i);
  });

  it("forged subjectId → updateProfile NOT called", async () => {
    await expect(
      saveProfileCore({ subjectId: VICTIM_ID, mode: "user", draft: {}, uploads })
    ).rejects.toThrow();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("forged subjectId → uploads NOT called (gate precedes upload side effects)", async () => {
    const draft = { __avatarFile: "a", __bannerFile: "b" };
    await expect(
      saveProfileCore({ subjectId: VICTIM_ID, mode: "user", draft, uploads })
    ).rejects.toThrow();
    expect(uploads.uploadAvatar).not.toHaveBeenCalled();
    expect(uploads.uploadBanner).not.toHaveBeenCalled();
  });

  it("missing session → throws and never writes", async () => {
    readCurrentAuthUser.mockResolvedValue(null);
    await expect(
      saveProfileCore({ subjectId: USER_ID, mode: "user", draft: {}, uploads })
    ).rejects.toThrow();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("vport mode bypasses this gate (readCurrentAuthUser not used; updateProfile called)", async () => {
    await saveProfileCore({ subjectId: VPORT_ID, mode: "vport", draft: {}, uploads });
    expect(readCurrentAuthUser).not.toHaveBeenCalled();
    expect(updateProfile).toHaveBeenCalledWith(VPORT_ID, "vport", expect.any(Object));
  });
});
