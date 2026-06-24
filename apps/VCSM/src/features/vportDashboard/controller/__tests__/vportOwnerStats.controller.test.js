/**
 * Regression tests — vportOwnerStats.controller
 *
 * VEN-DASH-001 / ELEK-003:
 * Owner quick stats must verify actor_owners before reading profile,
 * resource, staff, or booking data for a supplied target actorId.
 *
 * VEN-VPORTOS-002 / ELEK-2026-06-04-001 / BW-VPORTOS-001 / TESTREQ-BW-vportOwnerStats-001:
 * Controller must reject reads for soft-deleted or inactive VPORT profiles.
 *
 * Run: npx vitest run src/features/vportDashboard/controller/__tests__/vportOwnerStats.controller.test.js
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/authorization/adapters/authorization.adapter", () => ({
  assertSessionOwnsActorController: vi.fn(),
}));

vi.mock("@/features/vportDashboard/dal/read/vportProfile.read.dal", () => ({
  readVportProfileByActorIdDAL: vi.fn(),
}));

vi.mock("@/features/vportDashboard/dal/read/vportResource.read.dal", () => ({
  listVportResourcesByProfileIdDAL: vi.fn(),
  listVportStaffResourcesByProfileIdDAL: vi.fn(),
}));

vi.mock("@/features/vportDashboard/dal/read/listVportBookingsForProfileDay.read.dal", () => ({
  listVportBookingsForProfileDayDAL: vi.fn(),
}));

import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import { readVportProfileByActorIdDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import {
  listVportResourcesByProfileIdDAL,
  listVportStaffResourcesByProfileIdDAL,
} from "@/features/vportDashboard/dal/read/vportResource.read.dal";
import { listVportBookingsForProfileDayDAL } from "@/features/vportDashboard/dal/read/listVportBookingsForProfileDay.read.dal";
import { loadOwnerQuickStatsController } from "../vportOwnerStats.controller";

const TARGET_ACTOR_ID = "actor-vport-111";
const CALLER_ACTOR_ID = "actor-owner-222";
const currentDir = dirname(fileURLToPath(import.meta.url));
const vportFeatureDir = join(currentDir, "..");

function walkFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walkFiles(path);
    return [path];
  });
}

function read(path) {
  return readFileSync(path, "utf8");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadOwnerQuickStatsController — ownership gate", () => {
  it("requires actorId before ownership or stats reads", async () => {
    await expect(
      loadOwnerQuickStatsController({ callerActorId: CALLER_ACTOR_ID })
    ).rejects.toThrow("actorId is required");

    expect(assertSessionOwnsActorController).not.toHaveBeenCalled();
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled();
    expect(listVportStaffResourcesByProfileIdDAL).not.toHaveBeenCalled();
    expect(listVportResourcesByProfileIdDAL).not.toHaveBeenCalled();
    expect(listVportBookingsForProfileDayDAL).not.toHaveBeenCalled();
  });

  it("requires callerActorId", async () => {
    await expect(
      loadOwnerQuickStatsController({ actorId: TARGET_ACTOR_ID })
    ).rejects.toThrow("callerActorId is required");

    expect(assertSessionOwnsActorController).not.toHaveBeenCalled();
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled();
  });

  it("rejects unauthorized callers before any stats DAL read", async () => {
    assertSessionOwnsActorController.mockRejectedValue(
      new Error("Actor does not own this vport actor.")
    );

    await expect(
      loadOwnerQuickStatsController({
        actorId: TARGET_ACTOR_ID,
        callerActorId: "actor-attacker-999",
      })
    ).rejects.toThrow("Actor does not own this vport actor.");

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({
      targetActorId: TARGET_ACTOR_ID,
    });
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled();
    expect(listVportStaffResourcesByProfileIdDAL).not.toHaveBeenCalled();
    expect(listVportResourcesByProfileIdDAL).not.toHaveBeenCalled();
    expect(listVportBookingsForProfileDayDAL).not.toHaveBeenCalled();
  });

  it("reads stats only after ownership is verified", async () => {
    assertSessionOwnsActorController.mockResolvedValue({ ok: true, mode: "actor_owner" });
    readVportProfileByActorIdDAL.mockResolvedValue({ id: "profile-1", is_active: true, is_deleted: false });
    listVportStaffResourcesByProfileIdDAL.mockResolvedValue([
      { id: "staff-1", is_active: true, meta: { status: "linked" } },
      { id: "staff-2", is_active: false, meta: { status: "linked" } },
      { id: "staff-3", is_active: true, meta: { status: "pending" } },
    ]);
    listVportResourcesByProfileIdDAL.mockResolvedValue([
      { id: "resource-1" },
      { id: "resource-2" },
    ]);
    listVportBookingsForProfileDayDAL
      .mockResolvedValueOnce([{ id: "booking-today" }])
      .mockResolvedValueOnce([{ id: "booking-upcoming-1" }, { id: "booking-upcoming-2" }]);

    const result = await loadOwnerQuickStatsController({
      actorId: TARGET_ACTOR_ID,
      callerActorId: CALLER_ACTOR_ID,
    });

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({
      targetActorId: TARGET_ACTOR_ID,
    });
    expect(readVportProfileByActorIdDAL).toHaveBeenCalledWith({ actorId: TARGET_ACTOR_ID });
    expect(listVportStaffResourcesByProfileIdDAL).toHaveBeenCalledWith({ profileId: "profile-1" });
    expect(listVportResourcesByProfileIdDAL).toHaveBeenCalledWith({ profileId: "profile-1" });
    expect(listVportBookingsForProfileDayDAL).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      todayCount: 1,
      upcomingCount: 2,
      activeBarbers: 1,
    });
  });

  it("returns zero booking counts without booking DAL calls when no resources exist", async () => {
    assertSessionOwnsActorController.mockResolvedValue({ ok: true, mode: "actor_owner" });
    readVportProfileByActorIdDAL.mockResolvedValue({ id: "profile-1", is_active: true, is_deleted: false });
    listVportStaffResourcesByProfileIdDAL.mockResolvedValue([
      { id: "staff-1", is_active: true, meta: { status: "linked" } },
    ]);
    listVportResourcesByProfileIdDAL.mockResolvedValue([]);

    const result = await loadOwnerQuickStatsController({
      actorId: TARGET_ACTOR_ID,
      callerActorId: CALLER_ACTOR_ID,
    });

    expect(listVportBookingsForProfileDayDAL).not.toHaveBeenCalled();
    expect(result).toEqual({
      todayCount: 0,
      upcomingCount: 0,
      activeBarbers: 1,
    });
  });

  it("surfaces staff DAL failures instead of silently degrading to zero", async () => {
    assertSessionOwnsActorController.mockResolvedValue({ ok: true, mode: "actor_owner" });
    readVportProfileByActorIdDAL.mockResolvedValue({ id: "profile-1", is_active: true, is_deleted: false });
    listVportStaffResourcesByProfileIdDAL.mockRejectedValue(new Error("staff read failed"));
    listVportResourcesByProfileIdDAL.mockResolvedValue([{ id: "resource-1" }]);

    await expect(
      loadOwnerQuickStatsController({
        actorId: TARGET_ACTOR_ID,
        callerActorId: CALLER_ACTOR_ID,
      })
    ).rejects.toThrow("staff read failed");
  });

  it("keeps the vportOwnerStats controller path free of writes, RPCs, and edge calls", () => {
    const files = [
      "../vportOwnerStats.controller.js",
      "../../hooks/useOwnerQuickStats.js",
      "../../adapters/vportDashboard.adapter.js",
      "../../dal/read/vportProfile.read.dal.js",
      "../../dal/read/vportResource.read.dal.js",
      "../../dal/read/listVportBookingsForProfileDay.read.dal.js",
    ].map((path) => join(currentDir, path));

    const forbidden = [
      /\.insert\(/,
      /\.update\(/,
      /\.delete\(/,
      /\.upsert\(/,
      /\.rpc\(/,
      /invokeEdgeFunction|functions\.invoke/,
      /from\s+["'][^"']*\/dal\/write\//,
    ];

    for (const filePath of files) {
      const source = read(filePath);
      for (const pattern of forbidden) {
        expect(source, `${relative(vportFeatureDir, filePath)} matched ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("keeps dashboard/vport production files from importing vportOwnerStats test internals", () => {
    const offenders = walkFiles(vportFeatureDir).filter((filePath) => {
      if (!/\.(js|jsx)$/.test(filePath)) return false;
      if (filePath.includes("/__tests__/")) return false;
      return read(filePath).includes("__tests__");
    });

    expect(offenders.map((filePath) => relative(vportFeatureDir, filePath))).toEqual([]);
  });

  // TESTREQ-BW-vportOwnerStats-001
  // VEN-VPORTOS-002 / ELEK-2026-06-04-001 / BW-VPORTOS-001
  it("throws when VPORT profile is inactive (is_active: false)", async () => {
    assertSessionOwnsActorController.mockResolvedValue({ ok: true, mode: "actor_owner" });
    readVportProfileByActorIdDAL.mockResolvedValue({ id: "profile-1", is_active: false, is_deleted: false });

    await expect(
      loadOwnerQuickStatsController({
        actorId: TARGET_ACTOR_ID,
        callerActorId: CALLER_ACTOR_ID,
      })
    ).rejects.toThrow("VPORT profile is not available.");

    expect(listVportStaffResourcesByProfileIdDAL).not.toHaveBeenCalled();
    expect(listVportResourcesByProfileIdDAL).not.toHaveBeenCalled();
    expect(listVportBookingsForProfileDayDAL).not.toHaveBeenCalled();
  });

  // TESTREQ-BW-vportOwnerStats-001 (variant)
  // VEN-VPORTOS-002 / ELEK-2026-06-04-001 / BW-VPORTOS-001
  it("throws when VPORT profile is soft-deleted (is_deleted: true)", async () => {
    assertSessionOwnsActorController.mockResolvedValue({ ok: true, mode: "actor_owner" });
    readVportProfileByActorIdDAL.mockResolvedValue({ id: "profile-1", is_active: true, is_deleted: true });

    await expect(
      loadOwnerQuickStatsController({
        actorId: TARGET_ACTOR_ID,
        callerActorId: CALLER_ACTOR_ID,
      })
    ).rejects.toThrow("VPORT profile is not available.");

    expect(listVportStaffResourcesByProfileIdDAL).not.toHaveBeenCalled();
    expect(listVportResourcesByProfileIdDAL).not.toHaveBeenCalled();
    expect(listVportBookingsForProfileDayDAL).not.toHaveBeenCalled();
  });
});
