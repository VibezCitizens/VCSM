/**
 * Dead-path guard — vport service addon write controllers
 *
 * TICKET-VPORT-WRITECORE-OWNERBIND-001 (V05C1-M2 / V05C2-L1):
 * The dead, ungated addon write controllers (their write DALs never existed and
 * they had zero application consumers) were removed. This guard ensures they are
 * not silently re-wired ungated, and that the surviving deleteVportServiceAddon
 * remains session-gated.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const servicesDir = join(currentDir, ".."); // controller/services

describe("vport service addon — dead-path guard (V05C1-M2 / V05C2-L1)", () => {
  it("keeps the dead ungated addon write controllers removed", () => {
    expect(existsSync(join(servicesDir, "createOrUpdateVportServiceAddon.controller.js"))).toBe(false);
    expect(existsSync(join(servicesDir, "reorderVportServiceAddon.controller.js"))).toBe(false);
  });

  it("keeps the surviving deleteVportServiceAddon controller session-gated", () => {
    const src = readFileSync(join(servicesDir, "deleteVportServiceAddon.controller.js"), "utf8");
    expect(src).toContain("assertSessionOwnsActorController");
  });
});
