import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreate, mockUpdateStatus, mockReschedule } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockUpdateStatus: vi.fn(),
  mockReschedule: vi.fn(),
}));

vi.mock("@/features/vportDashboard/dashboard/cards/bookings", () => ({
  createOwnerBookingController: mockCreate,
  updateBookingStatusController: mockUpdateStatus,
  rescheduleBookingController: mockReschedule,
}));

import {
  createScheduleBooking,
  updateScheduleBookingStatus,
  rescheduleScheduleBooking,
} from "../controller/scheduleBookingCoordinator.controller";

describe("scheduleBookingCoordinator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createScheduleBooking delegates to createOwnerBookingController", async () => {
    const params = {
      callerActorId: "actor-1",
      resourceId: "res-1",
      startsAt: "2026-06-02T09:00:00.000Z",
      endsAt: "2026-06-02T09:30:00.000Z",
      timezone: "America/New_York",
      serviceLabelSnapshot: "Haircut",
      durationMinutes: 30,
    };
    mockCreate.mockResolvedValue({ id: "booking-1" });

    const result = await createScheduleBooking(params);

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith(params);
    expect(result).toEqual({ id: "booking-1" });
  });

  it("updateScheduleBookingStatus delegates to updateBookingStatusController", async () => {
    const params = { bookingId: "booking-1", status: "confirmed", callerActorId: "actor-1" };
    mockUpdateStatus.mockResolvedValue({ id: "booking-1", status: "confirmed" });

    const result = await updateScheduleBookingStatus(params);

    expect(mockUpdateStatus).toHaveBeenCalledOnce();
    expect(mockUpdateStatus).toHaveBeenCalledWith(params);
    expect(result).toEqual({ id: "booking-1", status: "confirmed" });
  });

  it("rescheduleScheduleBooking delegates to rescheduleBookingController", async () => {
    const params = {
      bookingId: "booking-1",
      startsAt: "2026-06-02T10:00:00.000Z",
      endsAt: "2026-06-02T10:30:00.000Z",
      resourceId: "res-1",
      durationMinutes: 30,
      callerActorId: "actor-1",
    };
    mockReschedule.mockResolvedValue({ id: "booking-1" });

    const result = await rescheduleScheduleBooking(params);

    expect(mockReschedule).toHaveBeenCalledOnce();
    expect(mockReschedule).toHaveBeenCalledWith(params);
    expect(result).toEqual({ id: "booking-1" });
  });
});
