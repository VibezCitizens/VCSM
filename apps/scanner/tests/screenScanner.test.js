import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { parseSourceAst } from "../src/parsers/ast/parser.js";
import { extractScreensFromAst } from "../src/parsers/ast/screenExtractor.js";
import { scanScreens } from "../src/scanners/screenScanner.js";

const BASE = new URL("./fixtures/screens/", import.meta.url);

async function readFixture(rel) {
  return fs.readFile(new URL(rel, BASE), "utf8");
}

function parseFixture(source, name) {
  const { ast } = parseSourceAst(source, name);
  return ast;
}

// --- screenExtractor ---

test("screenExtractor: detects screen with hooks", async () => {
  const source = await readFixture("apps/VCSM/src/features/dashboard/screens/VportDashboardLeadsScreen.jsx");
  const ast = parseFixture(source, "VportDashboardLeadsScreen.jsx");
  const screens = extractScreensFromAst(ast);
  assert.equal(screens.length, 1);
  const screen = screens[0];
  assert.equal(screen.name, "VportDashboardLeadsScreen");
  assert.equal(screen.exported, true);
  assert.equal(screen.hasHooks, true);
  assert.ok(screen.hookNames.includes("useLeads"));
});

test("screenExtractor: detects screen without hooks", async () => {
  const source = await readFixture("apps/VCSM/src/features/dashboard/screens/VportDashboardSimpleScreen.jsx");
  const ast = parseFixture(source, "VportDashboardSimpleScreen.jsx");
  const screens = extractScreensFromAst(ast);
  assert.equal(screens.length, 1);
  const screen = screens[0];
  assert.equal(screen.name, "VportDashboardSimpleScreen");
  assert.equal(screen.exported, true);
  assert.equal(screen.hasHooks, false);
  assert.deepEqual(screen.hookNames, []);
});

test("screenExtractor: non-screen file returns empty", async () => {
  const source = await readFixture("apps/VCSM/src/features/dashboard/routing/DashboardRoutes.jsx");
  const ast = parseFixture(source, "DashboardRoutes.jsx");
  const screens = extractScreensFromAst(ast);
  assert.equal(screens.length, 0);
});

// --- scanScreens ---

function makeRecord(relative, screens, layer = "screen", appId = "VCSM", feature = "dashboard") {
  return { relative, screens, layer, appId, feature };
}

function makeRouteMap(routes) {
  return { routes };
}

test("scanScreens: links route to view-screen (has hooks)", () => {
  const records = [
    makeRecord(
      "apps/VCSM/src/features/dashboard/screens/VportDashboardLeadsScreen.jsx",
      [{ name: "VportDashboardLeadsScreen", exported: true, hasHooks: true, hookNames: ["useLeads"] }]
    )
  ];
  const routeMap = makeRouteMap([
    { route: "/dashboard/leads", elementName: "VportDashboardLeadsScreen", access: "protected" }
  ]);

  const { screens } = scanScreens({}, records, { routeMap });
  assert.equal(screens.length, 1);
  const s = screens[0];
  assert.equal(s.component, "VportDashboardLeadsScreen");
  assert.equal(s.screenKind, "view-screen");
  assert.deepEqual(s.routes, ["/dashboard/leads"]);
  assert.equal(s.access, "protected");
  assert.equal(s.confidence, "HIGH");
  assert.ok(s.evidence.includes("linked to route element"));
  assert.ok(s.evidence.some((e) => e.startsWith("hooks:")));
});

test("scanScreens: classifies final-screen for no-hook route entry", () => {
  const records = [
    makeRecord(
      "apps/VCSM/src/features/dashboard/screens/VportDashboardSimpleScreen.jsx",
      [{ name: "VportDashboardSimpleScreen", exported: true, hasHooks: false, hookNames: [] }]
    )
  ];
  const routeMap = makeRouteMap([
    { route: "/dashboard/simple", elementName: "VportDashboardSimpleScreen", access: "protected" }
  ]);

  const { screens } = scanScreens({}, records, { routeMap });
  assert.equal(screens.length, 1);
  const s = screens[0];
  assert.equal(s.screenKind, "final-screen");
  assert.equal(s.confidence, "HIGH");
});

test("scanScreens: classifies unknown-screen for unlinked, no-hook screen", () => {
  const records = [
    makeRecord(
      "apps/VCSM/src/features/dashboard/screens/VportDashboardOrphanScreen.jsx",
      [{ name: "VportDashboardOrphanScreen", exported: true, hasHooks: false, hookNames: [] }]
    )
  ];
  const routeMap = makeRouteMap([]);

  const { screens } = scanScreens({}, records, { routeMap });
  assert.equal(screens.length, 1);
  assert.equal(screens[0].screenKind, "unknown-screen");
  assert.equal(screens[0].confidence, "MEDIUM");
  assert.deepEqual(screens[0].routes, []);
  assert.equal(screens[0].access, "unknown");
});

test("scanScreens: fallback entry for screen file with no named screen declarations", () => {
  const records = [
    makeRecord(
      "apps/VCSM/src/features/dashboard/screens/SomeOldScreen.jsx",
      [] // no extracted screen declarations
    )
  ];
  const routeMap = makeRouteMap([]);

  const { screens } = scanScreens({}, records, { routeMap });
  assert.equal(screens.length, 1);
  const s = screens[0];
  assert.equal(s.component, "SomeOldScreen");
  assert.equal(s.screenKind, "unknown-screen");
  assert.equal(s.confidence, "LOW");
});

test("scanScreens: skips non-screen files", () => {
  const records = [
    makeRecord(
      "apps/VCSM/src/features/dashboard/controller/someController.js",
      [],
      "controller"
    )
  ];
  const routeMap = makeRouteMap([]);
  const { screens } = scanScreens({}, records, { routeMap });
  assert.equal(screens.length, 0);
});

test("scanScreens: output is sorted by id", () => {
  const records = [
    makeRecord(
      "apps/VCSM/src/features/dashboard/screens/ZScreen.jsx",
      [{ name: "ZScreen", exported: true, hasHooks: false, hookNames: [] }]
    ),
    makeRecord(
      "apps/VCSM/src/features/dashboard/screens/AScreen.jsx",
      [{ name: "AScreen", exported: true, hasHooks: false, hookNames: [] }]
    )
  ];
  const routeMap = makeRouteMap([]);
  const { screens } = scanScreens({}, records, { routeMap });
  assert.equal(screens[0].component, "AScreen");
  assert.equal(screens[1].component, "ZScreen");
});
