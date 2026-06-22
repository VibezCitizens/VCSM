import { describe, it, expect } from "vitest";
import {
  GAS_ERROR_MESSAGES,
  normalizeGasError,
} from "@/features/vportDashboard/dashboard/cards/gasprices/model/gasErrorMessages";

const FALLBACK = "Something went wrong. Please try again.";

describe("GAS_ERROR_MESSAGES", () => {
  it("exports a non-empty map", () => {
    expect(Object.keys(GAS_ERROR_MESSAGES).length).toBeGreaterThan(0);
  });

  it("contains all expected reason codes", () => {
    const required = [
      "not_owner",
      "out_of_range",
      "too_far_from_official",
      "profile_not_found",
      "invalid_fuel_key",
      "already_pending",
      "invalid_number",
      "not_pending",
      "invalid_decision",
      "invalid_fuel_key_in_submission",
    ];
    for (const key of required) {
      expect(GAS_ERROR_MESSAGES).toHaveProperty(key);
      expect(typeof GAS_ERROR_MESSAGES[key]).toBe("string");
      expect(GAS_ERROR_MESSAGES[key].length).toBeGreaterThan(0);
    }
  });
});

describe("normalizeGasError", () => {
  it("returns null for null input", () => {
    expect(normalizeGasError(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(normalizeGasError(undefined)).toBeNull();
  });

  it("maps a known reason code from an object with .reason", () => {
    expect(normalizeGasError({ reason: "not_owner" })).toBe(GAS_ERROR_MESSAGES.not_owner);
    expect(normalizeGasError({ reason: "already_pending" })).toBe(GAS_ERROR_MESSAGES.already_pending);
    expect(normalizeGasError({ reason: "profile_not_found" })).toBe(GAS_ERROR_MESSAGES.profile_not_found);
    expect(normalizeGasError({ reason: "invalid_fuel_key" })).toBe(GAS_ERROR_MESSAGES.invalid_fuel_key);
    expect(normalizeGasError({ reason: "out_of_range" })).toBe(GAS_ERROR_MESSAGES.out_of_range);
    expect(normalizeGasError({ reason: "invalid_number" })).toBe(GAS_ERROR_MESSAGES.invalid_number);
    expect(normalizeGasError({ reason: "invalid_decision" })).toBe(GAS_ERROR_MESSAGES.invalid_decision);
    expect(normalizeGasError({ reason: "not_pending" })).toBe(GAS_ERROR_MESSAGES.not_pending);
  });

  it("maps a known reason code from an Error with .message matching a known key", () => {
    expect(normalizeGasError(new Error("not_owner"))).toBe(GAS_ERROR_MESSAGES.not_owner);
    expect(normalizeGasError(new Error("already_pending"))).toBe(GAS_ERROR_MESSAGES.already_pending);
  });

  it("returns fallback for unknown reason code", () => {
    expect(normalizeGasError({ reason: "totally_unknown_reason" })).toBe(FALLBACK);
  });

  it("returns fallback for a plain Error with unrecognized message", () => {
    expect(normalizeGasError(new Error("unexpected database failure"))).toBe(FALLBACK);
  });

  it("returns fallback for a plain string that is not a known key", () => {
    expect(normalizeGasError("some random error")).toBe(FALLBACK);
  });

  it(".reason takes precedence over .message", () => {
    const err = new Error("invalid_number");
    err.reason = "not_owner";
    expect(normalizeGasError(err)).toBe(GAS_ERROR_MESSAGES.not_owner);
  });
});
