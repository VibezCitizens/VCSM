import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/profiles/kinds/vport/dal/locksmith/vportLocksmithPost.read.dal", () => ({
  resolveVportLocksmithNameDAL: vi.fn(),
  hasRecentLocksmithServiceAreaPostDAL: vi.fn(),
  hasRecentLocksmithHoursPostDAL: vi.fn(),
  hasRecentLocksmithPortfolioPostDAL: vi.fn(),
}));

vi.mock("@/features/upload/adapters/posts.adapter", () => ({
  createSystemPost: vi.fn(),
}));

vi.mock("@/shared/utils/resolveRealm", () => ({
  PUBLIC_REALM_ID: "realm-public-001",
}));

vi.mock("@/features/booking/adapters/booking.adapter", () => ({
  assertSessionOwnsVportActorController: vi.fn(),
}));

import { publishLocksmithServiceAreaUpdateAsPostController } from "../publishLocksmithServiceAreaUpdateAsPost.controller";
import { publishLocksmithHoursUpdateAsPostController } from "../publishLocksmithHoursUpdateAsPost.controller";
import { publishLocksmithPortfolioUpdateAsPostController } from "../publishLocksmithPortfolioUpdateAsPost.controller";
import {
  resolveVportLocksmithNameDAL,
  hasRecentLocksmithServiceAreaPostDAL,
  hasRecentLocksmithHoursPostDAL,
  hasRecentLocksmithPortfolioPostDAL,
} from "@/features/profiles/kinds/vport/dal/locksmith/vportLocksmithPost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { assertSessionOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

const identityActorId = "actor-user-owner-1";
const actorId = "actor-vport-locksmith-1";

beforeEach(() => {
  vi.clearAllMocks();
  assertSessionOwnsVportActorController.mockResolvedValue({ ok: true });
  resolveVportLocksmithNameDAL.mockResolvedValue("Locksmith Vport");
  hasRecentLocksmithServiceAreaPostDAL.mockResolvedValue(false);
  hasRecentLocksmithHoursPostDAL.mockResolvedValue(false);
  hasRecentLocksmithPortfolioPostDAL.mockResolvedValue(false);
  createSystemPost.mockResolvedValue({ id: "post-locksmith-1" });
});

describe("locksmith publish controllers", () => {
  it("service area publish requires identityActorId and checks ownership", async () => {
    await expect(
      publishLocksmithServiceAreaUpdateAsPostController({ actorId, area: { label: "Austin" } })
    ).rejects.toThrow("identityActorId required");

    await publishLocksmithServiceAreaUpdateAsPostController({
      identityActorId,
      actorId,
      area: { label: "Austin" },
    });

    expect(assertSessionOwnsVportActorController).toHaveBeenCalledWith({
      targetActorId: actorId,
    });
    expect(createSystemPost).toHaveBeenCalledWith(
      expect.objectContaining({ actorId, post_type: "locksmith_service_area_update" })
    );
  });

  it("hours publish does not create a post when ownership fails", async () => {
    assertSessionOwnsVportActorController.mockRejectedValue(new Error("not owner"));
    await expect(
      publishLocksmithHoursUpdateAsPostController({
        identityActorId,
        actorId,
        blocks: [{ weekday: 1, startMinutes: 540, endMinutes: 1020 }],
      })
    ).rejects.toThrow("not owner");
    expect(hasRecentLocksmithHoursPostDAL).not.toHaveBeenCalled();
    expect(createSystemPost).not.toHaveBeenCalled();
  });

  it("portfolio publish returns skipped when dedup fires", async () => {
    hasRecentLocksmithPortfolioPostDAL.mockResolvedValue(true);
    const result = await publishLocksmithPortfolioUpdateAsPostController({
      identityActorId,
      actorId,
      portfolioTitle: "Smart lock install",
      jobType: "smart_lock",
      mediaUrl: "https://cdn.example.com/job.jpg",
    });

    expect(result).toMatchObject({ published: false, status: "skipped", reason: "throttled" });
    expect(createSystemPost).not.toHaveBeenCalled();
  });

  it("portfolio publish creates a locksmith_portfolio_update post on success", async () => {
    const result = await publishLocksmithPortfolioUpdateAsPostController({
      identityActorId,
      actorId,
      portfolioTitle: "Smart lock install",
      jobType: "smart_lock",
      mediaUrl: "https://cdn.example.com/job.jpg",
    });

    expect(createSystemPost).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId,
        post_type: "locksmith_portfolio_update",
        media_url: "https://cdn.example.com/job.jpg",
      })
    );
    expect(result).toEqual({ published: true, status: "published", postId: "post-locksmith-1" });
  });
});
