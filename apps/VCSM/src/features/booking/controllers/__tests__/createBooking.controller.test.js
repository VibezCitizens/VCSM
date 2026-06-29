/**
 * Regression tests — createBookingController (public customer session-bind)
 *
 * TICKET-VPORTBOOKING-CUSTOMERBIND-001 / V03B-M1:
 * On the public (source:"public") path the citizen kind/void check only proves
 * requestActorId is *a* citizen — it does NOT prove the authenticated session owns
 * it. The controller must session-bind requestActorId via the canonical user-only
 * self-form `assertActorOwnsActorController({ requestActorId, targetActorId:
 * requestActorId })` before assigning customer_actor_id / created_by_actor_id, so a
 * forged/victim citizen actorId cannot be attributed to a booking. On rejection NO
 * write DAL runs. Defense-in-depth; the durable boundary is vport.bookings RLS
 * (03B-DB-1, Phase 15). The management path (owner/admin/import/sync) is unchanged.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/booking/dal/getBookingResourceById.dal", () => ({ default: vi.fn() }));
vi.mock("@/features/booking/dal/getActorById.dal", () => ({ default: vi.fn() }));
vi.mock("@/features/booking/dal/insertBooking.dal", () => ({ default: vi.fn() }));
vi.mock("@/features/booking/dal/listBookingResourceServicesByResourceId.dal", () => ({
  listBookingResourceServicesByResourceIdDAL: vi.fn(),
}));
vi.mock("@/features/authorization/adapters/authorization.adapter", () => ({
  assertActorOwnsActorController: vi.fn(),
}));
vi.mock("@/features/notifications/adapters/notifications.adapter", () => ({
  publishVcsmNotification: vi.fn(),
}));
vi.mock("@/features/booking/model/booking.model", () => ({
  mapBookingRow: vi.fn((row) => ({ id: "booking-1", status: row?.status ?? "pending" })),
}));
vi.mock("@/services/monitoring/vcsmMonitoring", () => ({ captureVcsmError: vi.fn() }));

import createBookingController from "@/features/booking/controllers/createBooking.controller";
import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import getActorByIdDAL from "@/features/booking/dal/getActorById.dal";
import insertBookingDAL from "@/features/booking/dal/insertBooking.dal";
import { assertActorOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";

const RESOURCE_ID = "resource-1";
const OWNER_ACTOR = "vport-owner-actor-1";
const CITIZEN = "citizen-actor-1";

// Far-future slot so the "no longer available" guard (startsAt > now) always passes.
const STARTS_AT = "2099-01-01T10:00:00.000Z";
const ENDS_AT = "2099-01-01T10:30:00.000Z";

function basePublicArgs(overrides = {}) {
  return {
    requestActorId: CITIZEN,
    resourceId: RESOURCE_ID,
    serviceId: null,
    source: "public",
    startsAt: STARTS_AT,
    endsAt: ENDS_AT,
    timezone: "UTC",
    serviceLabelSnapshot: "Haircut",
    durationMinutes: 30,
    customerName: "Jane",
    customerNote: "note",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getBookingResourceByIdDAL.mockResolvedValue({ id: RESOURCE_ID, is_active: true, owner_actor_id: OWNER_ACTOR });
  getActorByIdDAL.mockResolvedValue({ id: CITIZEN, kind: "user", is_void: false });
  assertActorOwnsActorController.mockResolvedValue({ ok: true, mode: "self" });
  insertBookingDAL.mockResolvedValue({ id: "booking-1", status: "pending" });
});

describe("createBookingController — public customer session-bind (V03B-M1)", () => {
  it("1. forged requestActorId is rejected, never writes, and the self-form bind is invoked", async () => {
    assertActorOwnsActorController.mockRejectedValue(
      new Error("Requester actor is not bound to the authenticated session.")
    );

    await expect(createBookingController(basePublicArgs())).rejects.toThrow(
      "Requester actor is not bound to the authenticated session."
    );

    expect(assertActorOwnsActorController).toHaveBeenCalledWith({
      requestActorId: CITIZEN,
      targetActorId: CITIZEN,
    });
    expect(insertBookingDAL).not.toHaveBeenCalled();
    expect(publishVcsmNotification).not.toHaveBeenCalled();
  });

  it("2. legitimate owner: booking succeeds and insertBookingDAL is called exactly once", async () => {
    const result = await createBookingController(basePublicArgs());

    expect(assertActorOwnsActorController).toHaveBeenCalledWith({
      requestActorId: CITIZEN,
      targetActorId: CITIZEN,
    });
    expect(insertBookingDAL).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: "booking-1" });
  });

  it("3a. citizen-only kind gate preserved: non-citizen rejected BEFORE the session bind, no write", async () => {
    getActorByIdDAL.mockResolvedValue({ id: CITIZEN, kind: "vport", is_void: false });

    await expect(createBookingController(basePublicArgs())).rejects.toThrow(
      "Only citizens can book appointments. Switch to your citizen profile to reserve."
    );

    expect(assertActorOwnsActorController).not.toHaveBeenCalled();
    expect(insertBookingDAL).not.toHaveBeenCalled();
  });

  it("3b. payload values + notification preserved on the public path", async () => {
    await createBookingController(basePublicArgs());

    const { row } = insertBookingDAL.mock.calls[0][0];
    expect(row).toMatchObject({
      resource_id: RESOURCE_ID,
      customer_actor_id: CITIZEN,
      created_by_actor_id: CITIZEN,
      source: "public",
      starts_at: STARTS_AT,
      ends_at: ENDS_AT,
      timezone: "UTC",
      service_label_snapshot: "Haircut",
      duration_minutes: 30,
      customer_name: "Jane",
    });

    expect(publishVcsmNotification).toHaveBeenCalledTimes(1);
    const [notif] = publishVcsmNotification.mock.calls[0];
    expect(notif).toMatchObject({
      recipientActorId: OWNER_ACTOR,
      actorId: CITIZEN,
      kind: "booking_created",
      objectType: "booking",
      linkPath: null,
    });
  });
});

describe("createBookingController — management path remains byte-identical (V03B-M1 out of scope)", () => {
  const OWNER_USER = "owner-user-actor-1"; // the managing user actor (owns the vport)

  it("owner source binds against resource.owner_actor_id (NOT the self-form) and inserts", async () => {
    const result = await createBookingController({
      requestActorId: OWNER_USER,
      resourceId: RESOURCE_ID,
      serviceId: null,
      source: "owner",
      status: "confirmed",
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      timezone: "UTC",
      serviceLabelSnapshot: "Haircut",
      durationMinutes: 30,
    });

    // Management semantics: gate is against the resource owner actor, NOT requester self.
    expect(assertActorOwnsActorController).toHaveBeenCalledWith({
      requestActorId: OWNER_USER,
      targetActorId: OWNER_ACTOR, // resource.owner_actor_id — distinct from requester
    });
    expect(insertBookingDAL).toHaveBeenCalledTimes(1);
    const { row } = insertBookingDAL.mock.calls[0][0];
    expect(row).toMatchObject({
      customer_actor_id: OWNER_USER, // self-booking default for management
      created_by_actor_id: OWNER_USER,
      source: "owner",
      status: "confirmed",
    });
    expect(result).toMatchObject({ id: "booking-1" });
    // No public-booking notification on management source.
    expect(publishVcsmNotification).not.toHaveBeenCalled();
  });
});
