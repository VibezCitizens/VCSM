/**
 * Regression tests — shared dashboardVportDetails URL scheme allowlist
 *
 * TICKET-SHARED-NORMALIZEURL-SCHEME-HARDENING-001 / V14A-L1:
 * The private normalizeUrl must mirror the canonical safeMediaSrc allowlist so
 * non-image data: URLs and protocol-relative "//host" can no longer reach the
 * ClassicFlyer directions <a href> sink. Exercised ONLY through the exported
 * normalizeDashboardVportDetails API (no private-helper testing).
 *
 * Run: npx vitest run src/shared/lib/vport/__tests__/dashboardVportDetails.model.test.js
 */

import { describe, expect, it } from "vitest";
import { normalizeDashboardVportDetails } from "@/shared/lib/vport/dashboardVportDetails.model";

// websiteUrl is a direct normalizeUrl(source.website_url) projection — the
// simplest public window onto the scheme allowlist.
function website(url) {
  return normalizeDashboardVportDetails({ website_url: url }).websiteUrl;
}

describe("normalizeDashboardVportDetails URL scheme allowlist (V14A-L1)", () => {
  it("drops data:text/html", () => {
    expect(website("data:text/html,<script>alert(1)</script>")).toBe("");
  });

  it("drops non-image data: (application/*)", () => {
    expect(website("data:application/json,{}")).toBe("");
  });

  it("preserves data:image/*", () => {
    const v = "data:image/png;base64,iVBORw0KGgo=";
    expect(website(v)).toBe(v);
  });

  it("preserves blob:", () => {
    const v = "blob:https://app.example.com/8f3c-0000-uuid";
    expect(website(v)).toBe(v);
  });

  it("drops protocol-relative //host", () => {
    expect(website("//evil.com/x")).toBe("");
  });

  it("preserves root-relative /path", () => {
    expect(website("/relative/path")).toBe("/relative/path");
  });

  it("preserves https:// (returns an https URL)", () => {
    expect(website("https://example.com")).toBe("https://example.com/");
  });

  it("preserves http://", () => {
    expect(website("http://example.com")).toBe("http://example.com/");
  });

  it("normalizes a bare host to https://", () => {
    expect(website("example.com")).toBe("https://example.com/");
  });

  it("drops javascript:", () => {
    expect(website("javascript:alert(1)")).toBe("");
  });

  it("drops data:text/html at the directions href sink (the V14A-L1 sink)", () => {
    const out = normalizeDashboardVportDetails({
      directions_url: "data:text/html,<script>alert(1)</script>",
    });
    expect(out.directionsUrl).toBe("");
  });

  it("preserves a legitimate directions link", () => {
    const out = normalizeDashboardVportDetails({
      directions_url: "https://maps.google.com/?q=x",
    });
    expect(out.directionsUrl).toBe("https://maps.google.com/?q=x");
  });
});
