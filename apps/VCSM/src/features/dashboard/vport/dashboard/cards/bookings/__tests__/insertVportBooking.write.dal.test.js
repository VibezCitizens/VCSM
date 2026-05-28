/**
 * Unit tests — insertVportBookingDAL
 *
 * BOOK-001 (VENOM): 23505 unique_violation translation.
 *   Verifies that a PostgreSQL unique_violation (code 23505) triggered by the
 *   slot collision index (uq_vport_bookings_resource_starts_active) is translated
 *   into a clean user-facing error message before propagating to the controller.
 *
 * Coverage:
 *   - Missing required fields → clean validation error before any DB call
 *   - Success → returns inserted row
 *   - DB error code 23505 → translated to "This time slot is no longer available..."
 *   - Other DB error codes → propagated unchanged (no accidental swallowing)
 *
 * Run: npx vitest run src/features/dashboard/vport/dal/write/__tests__/insertVportBooking.write.dal.test.js
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock for the Supabase client chain
// ---------------------------------------------------------------------------
// vi.hoisted ensures mockSingle is defined before the vi.mock factory runs,
// so the factory can close over it.

const mockSingle = vi.hoisted(() => vi.fn());

vi.mock("@/services/supabase/vportClient", () => ({
  default: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: mockSingle,
        }),
      }),
    }),
  },
}));

import { insertVportBookingDAL } from "../dal/insertVportBooking.write.dal.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validRow = Object.freeze({
  profile_id:             "profile-aaa",
  resource_id:            "resource-bbb",
  starts_at:              new Date(Date.now() + 3_600_000).toISOString(),
  ends_at:                new Date(Date.now() + 7_200_000).toISOString(),
  timezone:               "America/New_York",
  service_label_snapshot: "Haircut",
  status:                 "pending",
  source:                 "public",
});

const insertedRow = Object.freeze({
  id:         "booking-uuid-001",
  profile_id: validRow.profile_id,
  resource_id: validRow.resource_id,
  status:     "pending",
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Default: successful insert
  mockSingle.mockResolvedValue({ data: insertedRow, error: null });
});

// ---------------------------------------------------------------------------
// Required field validation (no DB call)
// ---------------------------------------------------------------------------

describe("insertVportBookingDAL — required field validation", () => {
  it("throws when profile_id is missing", async () => {
    const { profile_id: _, ...rest } = validRow;
    await expect(insertVportBookingDAL({ row: rest })).rejects.toThrow("profile_id is required");
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it("throws when resource_id is missing", async () => {
    const { resource_id: _, ...rest } = validRow;
    await expect(insertVportBookingDAL({ row: rest })).rejects.toThrow("resource_id is required");
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it("throws when starts_at is missing", async () => {
    const { starts_at: _, ...rest } = validRow;
    await expect(insertVportBookingDAL({ row: rest })).rejects.toThrow("starts_at is required");
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it("throws when ends_at is missing", async () => {
    const { ends_at: _, ...rest } = validRow;
    await expect(insertVportBookingDAL({ row: rest })).rejects.toThrow("ends_at is required");
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it("throws when timezone is missing", async () => {
    const { timezone: _, ...rest } = validRow;
    await expect(insertVportBookingDAL({ row: rest })).rejects.toThrow("timezone is required");
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it("throws when service_label_snapshot is missing", async () => {
    const { service_label_snapshot: _, ...rest } = validRow;
    await expect(insertVportBookingDAL({ row: rest })).rejects.toThrow(
      "service_label_snapshot is required"
    );
    expect(mockSingle).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Success path
// ---------------------------------------------------------------------------

describe("insertVportBookingDAL — success path", () => {
  it("returns the inserted row on success", async () => {
    const result = await insertVportBookingDAL({ row: validRow });
    expect(result).toEqual(insertedRow);
  });

  it("calls the Supabase client exactly once", async () => {
    await insertVportBookingDAL({ row: validRow });
    expect(mockSingle).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// BOOK-001 — 23505 unique_violation translation
// ---------------------------------------------------------------------------

describe("insertVportBookingDAL — BOOK-001 slot collision (23505 translation)", () => {
  /**
   * When the slot collision partial unique index fires, PostgreSQL returns
   * error code '23505'. The DAL must translate this into a clean user-facing
   * error before propagating — the caller (controller) must never see raw
   * DB error objects for this code path.
   */

  it("translates error code 23505 to the slot-unavailable message", async () => {
    mockSingle.mockResolvedValue({
      data:  null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });

    await expect(insertVportBookingDAL({ row: validRow })).rejects.toThrow(
      "This time slot is no longer available. Please choose another time."
    );
  });

  it("throws an Error instance (not the raw DB error object) on 23505", async () => {
    const rawDbError = { code: "23505", message: "duplicate key value violates unique constraint" };
    mockSingle.mockResolvedValue({ data: null, error: rawDbError });

    let caught = null;
    try {
      await insertVportBookingDAL({ row: validRow });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught).not.toBe(rawDbError);
    expect(caught.message).toBe(
      "This time slot is no longer available. Please choose another time."
    );
  });

  it("does NOT return data on 23505 — always throws", async () => {
    mockSingle.mockResolvedValue({
      data:  null,
      error: { code: "23505", message: "unique violation" },
    });

    let result = "should not be set";
    try {
      result = await insertVportBookingDAL({ row: validRow });
    } catch {
      // expected
    }
    expect(result).toBe("should not be set");
  });
});

// ---------------------------------------------------------------------------
// Unrelated DB error passthrough
// ---------------------------------------------------------------------------

describe("insertVportBookingDAL — unrelated DB errors propagate unchanged", () => {
  it("propagates a 23503 foreign key violation error unchanged", async () => {
    const fkError = { code: "23503", message: "insert or update on table violates foreign key" };
    mockSingle.mockResolvedValue({ data: null, error: fkError });

    await expect(insertVportBookingDAL({ row: validRow })).rejects.toBe(fkError);
  });

  it("propagates a connection error unchanged", async () => {
    const connError = { code: "PGRST301", message: "JWT expired" };
    mockSingle.mockResolvedValue({ data: null, error: connError });

    await expect(insertVportBookingDAL({ row: validRow })).rejects.toBe(connError);
  });

  it("propagates a generic unknown error object unchanged", async () => {
    const unknownError = { message: "something unexpected" };
    mockSingle.mockResolvedValue({ data: null, error: unknownError });

    await expect(insertVportBookingDAL({ row: validRow })).rejects.toBe(unknownError);
  });
});
