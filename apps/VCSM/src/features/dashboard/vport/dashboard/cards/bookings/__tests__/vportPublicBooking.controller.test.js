/**
 * Regression tests — createVportPublicBookingController
 *
 * BOOK-002 (VENOM): Kind-gate enforcement regression coverage.
 *   Verifies that only actors with kind "user" can create bookings.
 *   VPORT actors and unknown actors must be rejected before any DAL write.
 *
 * Coverage:
 *   - VPORT actor → rejected → no insert, no notification
 *   - Unknown/missing actor → rejected → no insert, no notification
 *   - Citizen actor (kind:"user") → accepted → insert called, notification fired
 *   - Guest booking (requestActorId null) → actor check skipped → insert called, no notification
 *
 * Run: npx vitest run src/features/dashboard/vport/controller/__tests__/vportPublicBooking.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createVportPublicBookingController } from "../controller/vportPublicBooking.controller.js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock(
  "@/features/dashboard/vport/dal/read/vportResource.read.dal",
  () => ({
    getVportResourceByIdDAL: vi.fn(),
    listVportResourcesByProfileIdDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/dashboard/vport/dal/read/vportProfile.read.dal",
  () => ({
    getVportProfileIdByActorDAL: vi.fn(),
    getVportActorIdByProfileIdDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/dashboard/vport/dal/read/actorVport.read.dal",
  () => ({
    readActorVportLinkDAL: vi.fn(),
  })
);

// These DALs are imported by the controller but not exercised by createVportPublicBookingController
// Mock them to prevent Supabase client instantiation at test module init time
vi.mock(
  "@/features/dashboard/vport/dal/read/vportAvailabilityRules.read.dal",
  () => ({
    listVportAvailabilityRulesByResourceIdDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/dashboard/vport/dal/read/vportBookingsInRange.read.dal",
  () => ({
    listVportBookingsInRangeDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/dashboard/vport/dal/read/vportServices.read.dal",
  () => ({
    getVportServiceByIdDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/dashboard/vport/dashboard/cards/bookings/dal/insertVportBooking.write.dal",
  () => ({
    insertVportBookingDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/notifications/adapters/notifications.adapter",
  () => ({
    publishVcsmNotificationBatch: vi.fn(),
  })
);

// ---------------------------------------------------------------------------
// Imported mocks (for assertions)
// ---------------------------------------------------------------------------

import { getVportResourceByIdDAL } from "@/features/dashboard/vport/dal/read/vportResource.read.dal";
import { getVportActorIdByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { readActorVportLinkDAL } from "@/features/dashboard/vport/dal/read/actorVport.read.dal";
import { insertVportBookingDAL } from "@/features/dashboard/vport/dashboard/cards/bookings/dal/insertVportBooking.write.dal";
import { publishVcsmNotificationBatch } from "@/features/notifications/adapters/notifications.adapter";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RESOURCE_ID = "resource-uuid-abc";
const VPORT_ACTOR_ID = "vport-actor-111";
const CITIZEN_ACTOR_ID = "citizen-actor-222";
const PROFILE_ID = "profile-uuid-333";

// Starts 2 hours from now (always in the future)
function futureISO(offsetMs = 2 * 60 * 60 * 1000) {
  return new Date(Date.now() + offsetMs).toISOString();
}

const activeResource = Object.freeze({
  id: RESOURCE_ID,
  profile_id: PROFILE_ID,
  is_active: true,
  member_actor_id: null,
});

const citizenActor = Object.freeze({
  id: CITIZEN_ACTOR_ID,
  kind: "user",
  vport_id: null,
});

const vportActor = Object.freeze({
  id: VPORT_ACTOR_ID,
  kind: "vport",
  vport_id: "some-vport-uuid",
});

const insertedBooking = Object.freeze({
  id: "booking-uuid-999",
  profile_id: PROFILE_ID,
  resource_id: RESOURCE_ID,
  status: "pending",
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Default: active resource
  getVportResourceByIdDAL.mockResolvedValue(activeResource);

  // Default: no actor lookup (overridden per test)
  readActorVportLinkDAL.mockResolvedValue(null);

  // Default: vport actor id for notification routing
  getVportActorIdByProfileIdDAL.mockResolvedValue(VPORT_ACTOR_ID);

  // Default: successful insert
  insertVportBookingDAL.mockResolvedValue(insertedBooking);
});

// ---------------------------------------------------------------------------
// Shared valid booking args (time is always future)
// ---------------------------------------------------------------------------

function makeArgs(overrides = {}) {
  const startsAt = futureISO();
  const endsAt = futureISO(3 * 60 * 60 * 1000);
  return {
    resourceId: RESOURCE_ID,
    startsAt,
    endsAt,
    timezone: "America/New_York",
    durationMinutes: 30,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// BOOK-002 — Kind-gate regression
// ---------------------------------------------------------------------------

describe("createVportPublicBookingController — BOOK-002 kind-gate regression", () => {
  describe("VPORT actor (kind:\"vport\") is rejected", () => {
    beforeEach(() => {
      readActorVportLinkDAL.mockResolvedValue(vportActor);
    });

    it("throws 'Switch to your citizen profile to book.'", async () => {
      await expect(
        createVportPublicBookingController({
          ...makeArgs(),
          requestActorId: VPORT_ACTOR_ID,
        })
      ).rejects.toThrow("Switch to your citizen profile to book.");
    });

    it("does NOT call insertVportBookingDAL", async () => {
      await expect(
        createVportPublicBookingController({
          ...makeArgs(),
          requestActorId: VPORT_ACTOR_ID,
        })
      ).rejects.toThrow();

      expect(insertVportBookingDAL).not.toHaveBeenCalled();
    });

    it("does NOT call publishVcsmNotificationBatch", async () => {
      await expect(
        createVportPublicBookingController({
          ...makeArgs(),
          requestActorId: VPORT_ACTOR_ID,
        })
      ).rejects.toThrow();

      expect(publishVcsmNotificationBatch).not.toHaveBeenCalled();
    });
  });

  describe("Unknown actor (no DB record) is rejected", () => {
    beforeEach(() => {
      readActorVportLinkDAL.mockResolvedValue(null);
    });

    it("throws 'Only citizens can book appointments.'", async () => {
      await expect(
        createVportPublicBookingController({
          ...makeArgs(),
          requestActorId: "unknown-actor-id",
        })
      ).rejects.toThrow("Only citizens can book appointments.");
    });

    it("does NOT call insertVportBookingDAL", async () => {
      await expect(
        createVportPublicBookingController({
          ...makeArgs(),
          requestActorId: "unknown-actor-id",
        })
      ).rejects.toThrow();

      expect(insertVportBookingDAL).not.toHaveBeenCalled();
    });

    it("does NOT call publishVcsmNotificationBatch", async () => {
      await expect(
        createVportPublicBookingController({
          ...makeArgs(),
          requestActorId: "unknown-actor-id",
        })
      ).rejects.toThrow();

      expect(publishVcsmNotificationBatch).not.toHaveBeenCalled();
    });
  });

  describe("Citizen actor (kind:\"user\") is accepted", () => {
    beforeEach(() => {
      readActorVportLinkDAL.mockResolvedValue(citizenActor);
    });

    it("calls readActorVportLinkDAL with the requestActorId", async () => {
      await createVportPublicBookingController({
        ...makeArgs(),
        requestActorId: CITIZEN_ACTOR_ID,
      });

      expect(readActorVportLinkDAL).toHaveBeenCalledOnce();
      expect(readActorVportLinkDAL).toHaveBeenCalledWith({
        actorId: CITIZEN_ACTOR_ID,
      });
    });

    it("calls insertVportBookingDAL after passing kind gate", async () => {
      await createVportPublicBookingController({
        ...makeArgs(),
        requestActorId: CITIZEN_ACTOR_ID,
      });

      expect(insertVportBookingDAL).toHaveBeenCalledOnce();
    });

    it("forces customer_actor_id from requestActorId (VPD-V-019)", async () => {
      await createVportPublicBookingController({
        ...makeArgs(),
        requestActorId: CITIZEN_ACTOR_ID,
      });

      const insertCall = insertVportBookingDAL.mock.calls[0][0];
      expect(insertCall.row.customer_actor_id).toBe(CITIZEN_ACTOR_ID);
    });

    it("returns the booking result", async () => {
      const result = await createVportPublicBookingController({
        ...makeArgs(),
        requestActorId: CITIZEN_ACTOR_ID,
      });

      expect(result).toEqual(insertedBooking);
    });
  });

  describe("Guest booking (requestActorId null) — actor check intentionally skipped", () => {
    it("does NOT call readActorVportLinkDAL", async () => {
      await createVportPublicBookingController({
        ...makeArgs(),
        requestActorId: null,
      });

      expect(readActorVportLinkDAL).not.toHaveBeenCalled();
    });

    it("calls insertVportBookingDAL with customer_actor_id: null", async () => {
      await createVportPublicBookingController({
        ...makeArgs(),
        requestActorId: null,
      });

      expect(insertVportBookingDAL).toHaveBeenCalledOnce();
      const insertCall = insertVportBookingDAL.mock.calls[0][0];
      expect(insertCall.row.customer_actor_id).toBeNull();
    });

    it("does NOT call publishVcsmNotificationBatch for guest bookings", async () => {
      await createVportPublicBookingController({
        ...makeArgs(),
        requestActorId: null,
      });

      // No requestActorId → notification recipient set is never populated
      expect(publishVcsmNotificationBatch).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// BOOK-001 — Slot collision error propagation
// ---------------------------------------------------------------------------

describe("createVportPublicBookingController — BOOK-001 slot collision error propagation", () => {
  /**
   * The slot collision unique index (uq_vport_bookings_resource_starts_active)
   * fires in the DB and causes a 23505 unique_violation error. The DAL layer
   * translates that code into a clean user-facing Error before it reaches the
   * controller. These tests verify the translated message propagates intact —
   * the controller must not swallow or re-wrap it.
   */

  describe("when the DAL throws a slot-unavailable error (translated from DB 23505)", () => {
    beforeEach(() => {
      readActorVportLinkDAL.mockResolvedValue(citizenActor);
      insertVportBookingDAL.mockRejectedValue(
        new Error("This time slot is no longer available. Please choose another time.")
      );
    });

    it("propagates the slot-unavailable message to the caller", async () => {
      await expect(
        createVportPublicBookingController({
          ...makeArgs(),
          requestActorId: CITIZEN_ACTOR_ID,
        })
      ).rejects.toThrow("This time slot is no longer available. Please choose another time.");
    });

    it("does NOT suppress or re-wrap the slot-unavailable error", async () => {
      let caught = null;
      try {
        await createVportPublicBookingController({
          ...makeArgs(),
          requestActorId: CITIZEN_ACTOR_ID,
        });
      } catch (e) {
        caught = e;
      }
      expect(caught).not.toBeNull();
      expect(caught.message).toBe(
        "This time slot is no longer available. Please choose another time."
      );
    });

    it("does NOT call publishVcsmNotificationBatch when insert fails", async () => {
      await expect(
        createVportPublicBookingController({
          ...makeArgs(),
          requestActorId: CITIZEN_ACTOR_ID,
        })
      ).rejects.toThrow();

      expect(publishVcsmNotificationBatch).not.toHaveBeenCalled();
    });
  });

  describe("when the DAL throws an unrelated DB error", () => {
    const unrelatedError = Object.assign(new Error("connection timeout"), { code: "ECONNRESET" });

    beforeEach(() => {
      readActorVportLinkDAL.mockResolvedValue(citizenActor);
      insertVportBookingDAL.mockRejectedValue(unrelatedError);
    });

    it("propagates the unrelated error unchanged", async () => {
      await expect(
        createVportPublicBookingController({
          ...makeArgs(),
          requestActorId: CITIZEN_ACTOR_ID,
        })
      ).rejects.toThrow("connection timeout");
    });

    it("does NOT call publishVcsmNotificationBatch on unrelated DB error", async () => {
      await expect(
        createVportPublicBookingController({
          ...makeArgs(),
          requestActorId: CITIZEN_ACTOR_ID,
        })
      ).rejects.toThrow();

      expect(publishVcsmNotificationBatch).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// Input guards
// ---------------------------------------------------------------------------

describe("createVportPublicBookingController — input guards", () => {
  it("throws when resourceId is missing", async () => {
    await expect(
      createVportPublicBookingController({ ...makeArgs(), resourceId: undefined })
    ).rejects.toThrow("resourceId is required");
  });

  it("throws when startsAt is missing", async () => {
    await expect(
      createVportPublicBookingController({ ...makeArgs(), startsAt: undefined })
    ).rejects.toThrow("startsAt is required");
  });

  it("throws when endsAt is missing", async () => {
    await expect(
      createVportPublicBookingController({ ...makeArgs(), endsAt: undefined })
    ).rejects.toThrow("endsAt is required");
  });

  it("throws when timezone is missing", async () => {
    await expect(
      createVportPublicBookingController({ ...makeArgs(), timezone: undefined })
    ).rejects.toThrow("timezone is required");
  });

  it("throws when resource is inactive", async () => {
    getVportResourceByIdDAL.mockResolvedValue({ ...activeResource, is_active: false });

    await expect(
      createVportPublicBookingController(makeArgs())
    ).rejects.toThrow("not available for booking");
  });

  it("throws when resource is not found", async () => {
    getVportResourceByIdDAL.mockResolvedValue(null);

    await expect(
      createVportPublicBookingController(makeArgs())
    ).rejects.toThrow("not available for booking");
  });

  it("throws when startsAt is in the past", async () => {
    readActorVportLinkDAL.mockResolvedValue(citizenActor);

    const pastStart = new Date(Date.now() - 60_000).toISOString();
    const pastEnd = new Date(Date.now() - 30_000).toISOString();

    await expect(
      createVportPublicBookingController({
        ...makeArgs(),
        requestActorId: CITIZEN_ACTOR_ID,
        startsAt: pastStart,
        endsAt: pastEnd,
      })
    ).rejects.toThrow("no longer available");
  });
});
