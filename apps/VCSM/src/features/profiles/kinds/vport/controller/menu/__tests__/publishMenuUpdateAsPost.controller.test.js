import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/profiles/kinds/vport/dal/menu/vportMenuPost.read.dal", () => ({
  resolveVportRestaurantNameDAL: vi.fn(),
  hasRecentMenuUpdatePostDAL: vi.fn(),
}));

vi.mock("@/features/upload/adapters/posts.adapter", () => ({
  createSystemPost: vi.fn(),
}));

vi.mock("@/shared/utils/resolveRealm", () => ({
  PUBLIC_REALM_ID: "realm-public-001",
}));

vi.mock("@/features/authorization/adapters/authorization.adapter", () => ({
  assertSessionOwnsActorController: vi.fn(),
}));

import { publishMenuUpdateAsPostController } from "../publishMenuUpdateAsPost.controller";
import {
  resolveVportRestaurantNameDAL,
  hasRecentMenuUpdatePostDAL,
} from "@/features/profiles/kinds/vport/dal/menu/vportMenuPost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

const BASE_ARGS = {
  identityActorId: "actor-user-owner-1",
  actorId: "actor-vport-restaurant-1",
  action: "added",
  subject: "item",
  subjectName: "Strawberry Shortcake",
  categoryName: "Desserts",
  imageUrl: "https://cdn.example.com/shortcake.jpg",
};

beforeEach(() => {
  vi.clearAllMocks();
  assertSessionOwnsActorController.mockResolvedValue({ ok: true });
  hasRecentMenuUpdatePostDAL.mockResolvedValue(false);
  resolveVportRestaurantNameDAL.mockResolvedValue("Restaurant Vport");
  createSystemPost.mockResolvedValue({ id: "post-menu-1" });
});

describe("publishMenuUpdateAsPostController", () => {
  it("requires identityActorId before ownership checks", async () => {
    await expect(
      publishMenuUpdateAsPostController({ ...BASE_ARGS, identityActorId: null })
    ).rejects.toThrow("identityActorId required");
    expect(assertSessionOwnsActorController).not.toHaveBeenCalled();
    expect(createSystemPost).not.toHaveBeenCalled();
  });

  it("checks ownership before dedup or post creation", async () => {
    await publishMenuUpdateAsPostController(BASE_ARGS);
    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({
      targetActorId: "actor-vport-restaurant-1",
    });
    expect(hasRecentMenuUpdatePostDAL).toHaveBeenCalledWith({
      actorId: "actor-vport-restaurant-1",
    });
  });

  it("does not create a post when ownership fails", async () => {
    assertSessionOwnsActorController.mockRejectedValue(new Error("not owner"));
    await expect(publishMenuUpdateAsPostController(BASE_ARGS)).rejects.toThrow("not owner");
    expect(hasRecentMenuUpdatePostDAL).not.toHaveBeenCalled();
    expect(createSystemPost).not.toHaveBeenCalled();
  });

  it("returns skipped when menu dedup fires", async () => {
    hasRecentMenuUpdatePostDAL.mockResolvedValue(true);
    const result = await publishMenuUpdateAsPostController(BASE_ARGS);
    expect(result).toMatchObject({ published: false, status: "skipped", reason: "throttled" });
    expect(createSystemPost).not.toHaveBeenCalled();
  });

  it("creates a menu_update post on success", async () => {
    const result = await publishMenuUpdateAsPostController(BASE_ARGS);
    expect(createSystemPost).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "actor-vport-restaurant-1",
        post_type: "menu_update",
        media_url: "https://cdn.example.com/shortcake.jpg",
      })
    );
    expect(result).toEqual({ published: true, status: "published", postId: "post-menu-1" });
  });
});
