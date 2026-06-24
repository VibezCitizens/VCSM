/**
 * Regression tests — updateVportBooking.controller
 *
 * ELEK-2026-06-04-004:
 * Booking updates must carry the resolved booking profile_id into the write DAL
 * as defense-in-depth scope. Controller authorization still owns access control.
 *
 * Run: npx vitest run src/features/vportDashboard/dashboard/cards/bookings/__tests__/updateVportBooking.controller.test.js
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/vportDashboard/dal/write/updateVportBooking.write.dal", () => ({
  updateVportBookingDAL: vi.fn(),
}));

vi.mock("@/features/vportDashboard/dal/read/vportBookingById.read.dal", () => ({
  getVportBookingByIdDAL: vi.fn(),
}));

vi.mock("@/features/vportDashboard/dal/read/vportProfile.read.dal", () => ({
  getVportActorIdByProfileIdDAL: vi.fn(),
}));

vi.mock("@/features/vportDashboard/dal/read/vportBookingsInRange.read.dal", () => ({
  listVportBookingsInRangeDAL: vi.fn(),
}));

vi.mock("@/features/authorization/adapters/authorization.adapter", () => ({
  assertSessionOwnsActorController: vi.fn(),
}));

vi.mock("@/features/notifications/adapters/notifications.adapter", () => ({
  publishVcsmNotification: vi.fn(),
}));

import { updateVportBookingDAL } from "@/features/vportDashboard/dal/write/updateVportBooking.write.dal";
import { getVportBookingByIdDAL } from "@/features/vportDashboard/dal/read/vportBookingById.read.dal";
import { getVportActorIdByProfileIdDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import { listVportBookingsInRangeDAL } from "@/features/vportDashboard/dal/read/vportBookingsInRange.read.dal";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";
import {
  rescheduleBookingController,
  updateBookingStatusController,
} from "../controller/updateVportBooking.controller";

const BOOKING_ID = "booking-1";
const PROFILE_ID = "profile-1";
const RESOURCE_ID = "resource-1";
const OWNER_ACTOR_ID = "owner-actor-1";
const VPORT_ACTOR_ID = "vport-actor-1";

const activeBooking = Object.freeze({
  id: BOOKING_ID,
  profile_id: PROFILE_ID,
  resource_id: RESOURCE_ID,
  customer_actor_id: "customer-actor-1",
  status: "pending",
});

beforeEach(() => {
  vi.clearAllMocks();
  getVportBookingByIdDAL.mockResolvedValue(activeBooking);
  getVportActorIdByProfileIdDAL.mockResolvedValue(VPORT_ACTOR_ID);
  assertSessionOwnsActorController.mockResolvedValue({ ok: true });
  updateVportBookingDAL.mockResolvedValue({ ...activeBooking, status: "confirmed" });
  listVportBookingsInRangeDAL.mockResolvedValue([]);
  publishVcsmNotification.mockResolvedValue(undefined);
});

describe("updateBookingStatusController booking profile scope", () => {
  it("passes booking.profile_id to updateVportBookingDAL after owner authorization", async () => {
    await updateBookingStatusController({
      bookingId: BOOKING_ID,
      status: "confirmed",
      callerActorId: OWNER_ACTOR_ID,
    });

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({
      targetActorId: VPORT_ACTOR_ID,
    });
    expect(updateVportBookingDAL).toHaveBeenCalledWith({
      bookingId: BOOKING_ID,
      profileId: PROFILE_ID,
      updates: { status: "confirmed" },
    });
  });

  it("does not call update DAL when owner authorization fails", async () => {
    assertSessionOwnsActorController.mockRejectedValue(new Error("not owner"));

    await expect(
      updateBookingStatusController({
        bookingId: BOOKING_ID,
        status: "confirmed",
        callerActorId: "attacker-actor",
      })
    ).rejects.toThrow("not owner");

    expect(updateVportBookingDAL).not.toHaveBeenCalled();
  });
});

describe("rescheduleBookingController booking profile scope", () => {
  it("passes booking.profile_id to updateVportBookingDAL after conflict and owner checks", async () => {
    await rescheduleBookingController({
      bookingId: BOOKING_ID,
      startsAt: "2026-06-05T10:00:00.000Z",
      endsAt: "2026-06-05T10:30:00.000Z",
      callerActorId: OWNER_ACTOR_ID,
    });

    expect(updateVportBookingDAL).toHaveBeenCalledWith({
      bookingId: BOOKING_ID,
      profileId: PROFILE_ID,
      updates: {
        starts_at: "2026-06-05T10:00:00.000Z",
        ends_at: "2026-06-05T10:30:00.000Z",
        resource_id: RESOURCE_ID,
      },
    });
  });
});
