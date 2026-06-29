/**
 * Regression tests — vport content controllers session-bound ownership
 *
 * TICKET-VPORT-WRITECORE-OWNERBIND-001 / V05C1-M1:
 * Every content controller must gate on the session-derived
 * assertSessionOwnsActorController({ targetActorId: actorId }) — replacing the
 * caller-equality self-grant — and must perform NO DAL access when the session
 * does not own the vport. The denial error text is preserved exactly.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/authorization/adapters/authorization.adapter", () => ({
  assertSessionOwnsActorController: vi.fn(),
}));

vi.mock("@/features/profiles/kinds/vport/dal/content/createVportContentPage.dal", () => ({
  default: vi.fn(),
  readContentPageSlugsByPrefixDAL: vi.fn(),
}));
vi.mock("@/features/profiles/kinds/vport/dal/content/readVportContentPage.dal", () => ({ default: vi.fn() }));
vi.mock("@/features/profiles/kinds/vport/dal/content/updateVportContentPage.dal", () => ({ default: vi.fn() }));
vi.mock("@/features/profiles/kinds/vport/dal/content/deleteVportContentPage.dal", () => ({ default: vi.fn() }));
vi.mock("@/features/profiles/kinds/vport/dal/content/toggleVportContentPagePublish.dal", () => ({ default: vi.fn() }));
vi.mock("@/features/profiles/kinds/vport/dal/content/listVportContentPages.dal", () => ({ default: vi.fn() }));
vi.mock("@/features/profiles/kinds/vport/dal/content/listVportPublicContentPages.dal", () => ({
  invalidateVportPublicContentCache: vi.fn(),
}));
vi.mock("@/features/profiles/kinds/vport/model/content/VportContentPage.model", () => ({
  default: { fromRow: vi.fn((r) => r), fromRows: vi.fn((r) => r) },
}));

import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import createVportContentPageController from "@/features/profiles/kinds/vport/controller/content/createVportContentPage.controller";
import updateVportContentPageController from "@/features/profiles/kinds/vport/controller/content/updateVportContentPage.controller";
import deleteVportContentPageController from "@/features/profiles/kinds/vport/controller/content/deleteVportContentPage.controller";
import toggleVportContentPagePublishController from "@/features/profiles/kinds/vport/controller/content/toggleVportContentPagePublish.controller";
import listVportContentPagesController from "@/features/profiles/kinds/vport/controller/content/listVportContentPages.controller";
import createDAL, { readContentPageSlugsByPrefixDAL } from "@/features/profiles/kinds/vport/dal/content/createVportContentPage.dal";
import updateDAL from "@/features/profiles/kinds/vport/dal/content/updateVportContentPage.dal";
import deleteDAL from "@/features/profiles/kinds/vport/dal/content/deleteVportContentPage.dal";
import toggleDAL from "@/features/profiles/kinds/vport/dal/content/toggleVportContentPagePublish.dal";
import listDAL from "@/features/profiles/kinds/vport/dal/content/listVportContentPages.dal";

const VPORT = "vport-actor-xyz";

const CASES = [
  { name: "create", run: () => createVportContentPageController({ actorId: VPORT, callerActorId: VPORT, title: "Hello" }), writeDAL: () => createDAL },
  { name: "update", run: () => updateVportContentPageController({ actorId: VPORT, callerActorId: VPORT, id: "p1" }), writeDAL: () => updateDAL },
  { name: "delete", run: () => deleteVportContentPageController({ actorId: VPORT, callerActorId: VPORT, id: "p1" }), writeDAL: () => deleteDAL },
  { name: "togglePublish", run: () => toggleVportContentPagePublishController({ actorId: VPORT, callerActorId: VPORT, id: "p1", isPublished: true }), writeDAL: () => toggleDAL },
  { name: "list", run: () => listVportContentPagesController({ actorId: VPORT, callerActorId: VPORT }), writeDAL: () => listDAL },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("vport content controllers — session-bound ownership (V05C1-M1)", () => {
  for (const c of CASES) {
    it(`${c.name}: rejects (preserving error text) and performs no DAL access when the session does not own the vport`, async () => {
      assertSessionOwnsActorController.mockRejectedValue(new Error("denied"));

      await expect(c.run()).rejects.toThrow("Only the actor owner can manage this content.");

      expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT });
      expect(c.writeDAL()).not.toHaveBeenCalled();
    });
  }

  it("create: proceeds to the write when the session owns the vport", async () => {
    assertSessionOwnsActorController.mockResolvedValue({ ok: true });
    readContentPageSlugsByPrefixDAL.mockResolvedValue([]);
    createDAL.mockResolvedValue({ id: "page-1" });

    const result = await createVportContentPageController({ actorId: VPORT, callerActorId: VPORT, title: "Hello" });

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT });
    expect(createDAL).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "page-1" });
  });

  it("list: proceeds to the read when the session owns the vport", async () => {
    assertSessionOwnsActorController.mockResolvedValue({ ok: true });
    listDAL.mockResolvedValue([{ id: "page-1" }]);

    const result = await listVportContentPagesController({ actorId: VPORT, callerActorId: VPORT });

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT });
    expect(listDAL).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "page-1" }]);
  });
});
