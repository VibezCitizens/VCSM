/**
 * Regression tests — cancelBookingController session-bound customer cancel
 *
 * TICKET-BOOKING-CUSTOMER-CANCEL-OWNERBIND-001 / V08A-M1:
 * The customer-cancel path must session-bind via the canonical Batch-A gate
 * assertActorOwnsActorController({ requestActorId: customer, targetActorId: customer })
 * (the customer is a user actor; assertSessionOwnsActorController is vport-only and
 * is intentionally NOT used). The provider path and existing guards are unchanged.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/authorization/adapters/authorization.adapter", () => ({
  assertActorOwnsActorController: vi.fn(),
}));
vi.mock("@/features/booking/dal/getBookingById.dal", () => ({ default: vi.fn() }));
vi.mock("@/features/booking/dal/getBookingResourceById.dal", () => ({ default: vi.fn() }));
vi.mock("@/features/booking/dal/updateBookingStatus.dal", () => ({ default: vi.fn() }));
vi.mock("@/features/booking/dal/getVportSlugByActorId.dal", () => ({ getVportSlugByActorIdDAL: vi.fn() }));
vi.mock("@/features/booking/model/booking.model", () => ({ mapBookingRow: vi.fn((r) => r) }));
vi.mock("@/features/notifications/adapters/notifications.adapter", () => ({ publishVcsmNotification: vi.fn() }));
vi.mock("@/services/monitoring/vcsmMonitoring", () => ({ captureVcsmError: vi.fn() }));

import { cancelBookingController } from "@/features/booking/controllers/cancelBooking.controller";
import { assertActorOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import getBookingByIdDAL from "@/features/booking/dal/getBookingById.dal";
import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import updateBookingStatusDAL from "@/features/booking/dal/updateBookingStatus.dal";

const CUSTOMER = "cust-1";
const PROVIDER_USER = "owner-user-1";
const VPORT = "vport-1";

const activeBooking = (overrides = {}) => ({
  id: "b1",
  customer_actor_id: CUSTOMER,
  resource_id: "r1",
  status: "confirmed",
  service_label_snapshot: "Haircut",
  starts_at: "2026-07-01T10:00:00Z",
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  getBookingResourceByIdDAL.mockResolvedValue({ owner_actor_id: VPORT });
  updateBookingStatusDAL.mockResolvedValue({ id: "b1", status: "cancelled" });
});

describe("cancelBookingController — customer session-bind (V08A-M1)", () => {
  it("rejects when the customer session does NOT own customer_actor_id — no status write", async () => {
    getBookingByIdDAL.mockResolvedValue(activeBooking());
    assertActorOwnsActorController.mockRejectedValue(new Error("not owned"));

    await expect(
      cancelBookingController({ bookingId: "b1", requestActorId: CUSTOMER })
    ).rejects.toThrow("not owned");

    expect(assertActorOwnsActorController).toHaveBeenCalledWith({
      requestActorId: CUSTOMER,
      targetActorId: CUSTOMER,
    });
    expect(updateBookingStatusDAL).not.toHaveBeenCalled();
  });

  it("cancels when the customer session owns customer_actor_id — status written once", async () => {
    getBookingByIdDAL.mockResolvedValue(activeBooking());
    assertActorOwnsActorController.mockResolvedValue({ ok: true });

    const result = await cancelBookingController({ bookingId: "b1", requestActorId: CUSTOMER });

    expect(assertActorOwnsActorController).toHaveBeenCalledWith({
      requestActorId: CUSTOMER,
      targetActorId: CUSTOMER,
    });
    expect(updateBookingStatusDAL).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "b1", status: "cancelled" });
  });
});

describe("cancelBookingController — provider path unchanged", () => {
  it("authorizes the provider via the resource owner actor", async () => {
    getBookingByIdDAL.mockResolvedValue(activeBooking());
    assertActorOwnsActorController.mockResolvedValue({ ok: true });

    const result = await cancelBookingController({ bookingId: "b1", requestActorId: PROVIDER_USER });

    expect(assertActorOwnsActorController).toHaveBeenCalledWith({
      requestActorId: PROVIDER_USER,
      targetActorId: VPORT,
    });
    expect(updateBookingStatusDAL).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "b1", status: "cancelled" });
  });
});

describe("cancelBookingController — existing guards intact", () => {
  it("throws when the booking is not found", async () => {
    getBookingByIdDAL.mockResolvedValue(null);

    await expect(
      cancelBookingController({ bookingId: "b1", requestActorId: CUSTOMER })
    ).rejects.toThrow("Booking not found.");

    expect(assertActorOwnsActorController).not.toHaveBeenCalled();
    expect(updateBookingStatusDAL).not.toHaveBeenCalled();
  });

  it("throws when the booking is already in a terminal status", async () => {
    getBookingByIdDAL.mockResolvedValue(activeBooking({ status: "cancelled" }));

    await expect(
      cancelBookingController({ bookingId: "b1", requestActorId: CUSTOMER })
    ).rejects.toThrow("terminal state");

    expect(updateBookingStatusDAL).not.toHaveBeenCalled();
  });

  it("treats a guest booking (null customer_actor_id) as provider-only — customer self-bind not invoked", async () => {
    getBookingByIdDAL.mockResolvedValue(activeBooking({ customer_actor_id: null }));
    assertActorOwnsActorController.mockResolvedValue({ ok: true });

    const result = await cancelBookingController({ bookingId: "b1", requestActorId: PROVIDER_USER });

    // Provider gate only — never the customer self-form (no customer_actor_id).
    expect(assertActorOwnsActorController).toHaveBeenCalledTimes(1);
    expect(assertActorOwnsActorController).toHaveBeenCalledWith({
      requestActorId: PROVIDER_USER,
      targetActorId: VPORT,
    });
    expect(result).toEqual({ id: "b1", status: "cancelled" });
  });
});
